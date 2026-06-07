// --- Supabase Client & Database Utilities ---

const SUPABASE_URL = (window.ENV && window.ENV.SUPABASE_URL) || '';
const SUPABASE_KEY = (window.ENV && window.ENV.SUPABASE_KEY) || '';

let dbClient = null;

if (window.supabase) {
  dbClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

  window.supabaseClient = dbClient;
}

// --- Customer Session Management ---
const SessionManager = {
  isLoggedIn() {
    return !!localStorage.getItem("bh_customer_session");
  },

  getCurrentCustomer() {
    return JSON.parse(
      localStorage.getItem("bh_customer_session")
    );
  },

  logoutCustomer() {
    localStorage.removeItem("bh_customer_session");
    localStorage.removeItem("bh_shopping_cart");
  }
};

window.SessionManager = SessionManager;

// --- Orders and Transactions ---
const OrderManager = {
  placeOrder: async (customerName, customerMobile, items, totalAmount, packagingEnabled, addressData = {}) => {
    if (!dbClient) return { error: 'Database not initialized' };

    try {
      // Generate client-side UUID
      const orderId = crypto.randomUUID();
      const shortOrderId = 'BH-' + orderId.split('-')[0].toUpperCase();

      const orderPayload = {
        id: orderId,
        customer_name: customerName,
        customer_mobile: customerMobile,
        order_items: items, // JSONB
        total_amount: totalAmount,
        packaging: packagingEnabled,
        order_status: 'Pending',
        flat_number: addressData.flat_number || null,
        street: addressData.street || null,
        area: addressData.area || null,
        city: addressData.city || null,
        state: addressData.state || null,
        pincode: addressData.pincode || null,
        landmark: addressData.landmark || null,
        receiver_name: addressData.receiver_name || null,
        receiver_mobile: addressData.receiver_mobile || null,
        full_address: addressData.full_address || null
      };

      const { data, error } = await dbClient
        .from('orders')
        .insert([orderPayload])
        .select()
        .single();

      if (error) throw error;

      // Trigger Notifications (webhook call)
      await OrderManager.triggerNotifications(shortOrderId, customerName, customerMobile, items, totalAmount, packagingEnabled, addressData);

      return { data, shortOrderId };
    } catch (e) {
      console.error('Order placement error:', e);
      return { error: e.message || 'Failed to place order' };
    }
  },

  triggerNotifications: async (shortOrderId, customerName, customerMobile, items, totalAmount, packagingEnabled, addressData = {}) => {
    // 1. Calculate subtotal
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const packaging = packagingEnabled ? 'Yes' : 'No';
    
    // Format date as "DD/MM/YYYY hh:mm AM/PM"
    const now = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    const day = pad(now.getDate());
    const month = pad(now.getMonth() + 1);
    const year = now.getFullYear();
    let hours = now.getHours();
    const minutes = pad(now.getMinutes());
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const orderTime = `${day}/${month}/${year} ${pad(hours)}:${minutes} ${ampm}`;

    // Map items list and include lineTotal
    const mappedItems = items.map(item => ({
      id: item.id,
      name: item.name,
      qty: item.qty,
      price: item.price,
      lineTotal: item.price * item.qty
    }));

    // Construct itemsSummary
    const itemsSummary = items.map(item => `${item.name} x${item.qty} - ₹${item.price * item.qty}`).join('\n');

    // Build the clean payload as requested
    const orderData = {
      customerName,
      mobile: customerMobile,
      subtotal,
      total: totalAmount,
      packaging,
      orderTime,
      orderId: shortOrderId,
      itemsSummary,
      items: mappedItems,
      flatNumber: addressData.flat_number || '',
      street: addressData.street || '',
      area: addressData.area || '',
      city: addressData.city || '',
      state: addressData.state || '',
      landmark: addressData.landmark || '',
      pincode: addressData.pincode || '',
      receiverName: addressData.receiver_name || '',
      receiverMobile: addressData.receiver_mobile || '',
      fullAddress: addressData.full_address || '',

      // snake_case fields for compatibility
      customer_name: customerName,
      customer_mobile: customerMobile,
      flat_number: addressData.flat_number || '',
      street: addressData.street || '',
      area: addressData.area || '',
      city: addressData.city || '',
      state: addressData.state || '',
      landmark: addressData.landmark || '',
      pincode: addressData.pincode || '',
      receiver_name: addressData.receiver_name || '',
      receiver_mobile: addressData.receiver_mobile || '',
      full_address: addressData.full_address || ''
    };

    // 2. Fetch notification settings from database
    let webhookUrl = 'https://hook.eu1.make.com/zdpo5obv3u42thgx97a9jzaocjifzgzm'; // fallback default
    
    if (dbClient) {
      try {
        const { data: settingsList, error: settingsError } = await dbClient
          .from('notification_settings')
          .select('*');
        if (!settingsError && settingsList && settingsList.length > 0) {
          const s = settingsList[0];
          if (s.make_webhook_url) webhookUrl = s.make_webhook_url;
          orderData.ownerEmail = s.owner_email || '';
          orderData.ownerWhatsApp = s.owner_whatsapp || '';
          orderData.telegramBotToken = s.telegram_bot_token || '';
          orderData.telegramChatId = s.telegram_chat_id || '';
        }
      } catch (err) {
        console.warn('Failed to load webhook URL from settings table, using default.', err);
      }
    }

    console.log('Dispatching order payload to Make.com Webhook:', webhookUrl, orderData);

    // Call Make.com Webhook (Email & WhatsApp notification)
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      console.log('Make.com webhook response status:', response.status);
    } catch (err) {
      console.error('Failed to send payload to Make.com webhook:', err);
    }

    // Call Telegram Notification
    try {
      await OrderManager.sendTelegramOrderNotification(orderData);
    } catch (err) {
      console.error('Failed to send Telegram order notification:', err);
    }
  },

  sendTelegramOrderNotification: async (orderData) => {
    const token = orderData.telegramBotToken;
    const chatId = orderData.telegramChatId;
    if (!token || !chatId) {
      console.warn('Telegram Bot Token or Chat ID not configured. Skipping Telegram notification.');
      return;
    }

    // Formatted Telegram HTML Message
    const message = `━━━━━━━━━━━━━━━━━━━━━━

🍛 <b>NEW BENGALI HOTEL ORDER</b>

🆔 <b>Order ID:</b>
${orderData.orderId}

👤 <b>Customer:</b>
${orderData.customerName}

📱 <b>Mobile:</b>
${orderData.mobile}

👤 <b>Receiver Name:</b>
${orderData.receiverName || orderData.customerName}

📱 <b>Receiver Mobile:</b>
${orderData.receiverMobile || orderData.mobile}

📍 <b>Delivery Address:</b>
${orderData.flatNumber ? `${orderData.flatNumber}, ${orderData.street}, ${orderData.area}, ${orderData.city}, ${orderData.state} - ${orderData.pincode} (Landmark: ${orderData.landmark})` : orderData.fullAddress}

━━━━━━━━━━━━━━━━━━━━━━

🍽 <b>ORDERED ITEMS</b>

${orderData.itemsSummary}

━━━━━━━━━━━━━━━━━━━━━━

💰 <b>Subtotal:</b> ₹${orderData.subtotal}

💵 <b>Total Amount:</b> ₹${orderData.total}

📦 <b>Packaging:</b> ${orderData.packaging}

⏰ <b>Order Time:</b>
${orderData.orderTime}

━━━━━━━━━━━━━━━━━━━━━━

⚡ <b>Status:</b> PENDING

━━━━━━━━━━━━━━━━━━━━━━`;

    try {
      const url = `https://api.telegram.org/bot${token}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML'
        })
      });
      const resJson = await response.json();
      console.log('Telegram sendMessage response:', resJson);
    } catch (err) {
      console.error('Failed to send Telegram notification:', err);
      // Fail silently, do not throw to allow order workflow completion
    }
  },

  triggerStatusUpdateNotification: async (order, newStatus) => {
    let webhookUrl = 'https://hook.eu1.make.com/zdpo5obv3u42thgx97a9jzaocjifzgzm';
    let telegramBotToken = '';
    let telegramChatId = '';
    
    if (dbClient) {
      try {
        const { data: settingsList } = await dbClient
          .from('notification_settings')
          .select('*');
        if (settingsList && settingsList.length > 0) {
          const s = settingsList[0];
          if (s.make_webhook_url) webhookUrl = s.make_webhook_url;
          telegramBotToken = s.telegram_bot_token || '';
          telegramChatId = s.telegram_chat_id || '';
        }
      } catch (err) {
        console.warn('Failed to load webhook for status change:', err);
      }
    }

    const shortOrderId = 'BH-' + order.id.split('-')[0].toUpperCase();
    const items = order.order_items || [];
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const packaging = order.packaging ? 'Yes' : 'No';
    
    // Format order date
    const now = new Date(order.created_at || new Date());
    const pad = (n) => n.toString().padStart(2, '0');
    const day = pad(now.getDate());
    const month = pad(now.getMonth() + 1);
    const year = now.getFullYear();
    let hours = now.getHours();
    const minutes = pad(now.getMinutes());
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const orderTime = `${day}/${month}/${year} ${pad(hours)}:${minutes} ${ampm}`;

    const mappedItems = items.map(item => ({
      id: item.id,
      name: item.name,
      qty: item.qty,
      price: item.price,
      lineTotal: item.price * item.qty
    }));

    const itemsSummary = items.map(item => `${item.name} x${item.qty} - ₹${item.price * item.qty}`).join('\n');

    const payload = {
      event: "status_update",
      orderId: shortOrderId,
      customerName: order.customer_name,
      customerMobile: order.customer_mobile,
      mobile: order.customer_mobile,
      status: newStatus,
      subtotal,
      total: order.total_amount,
      packaging,
      orderTime,
      itemsSummary,
      items: mappedItems
    };

    console.log('Sending status update payload to webhook:', webhookUrl, payload);
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.error('Failed to trigger status update webhook:', err);
    }

    // Trigger Telegram Status Update message
    if (telegramBotToken && telegramChatId) {
      const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
      const statusMessage = `🔄 <b>ORDER STATUS UPDATED</b>

Order ID: ${shortOrderId}

Customer: ${order.customer_name}

New Status: ${newStatus}

Time: ${timestamp}`;

      try {
        const url = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: telegramChatId,
            text: statusMessage,
            parse_mode: 'HTML'
          })
        });
        const resJson = await response.json();
        console.log('Telegram status update notification response:', resJson);
      } catch (err) {
        console.error('Failed to send Telegram status update notification:', err);
      }
    }
  },

  getCustomerOrders: async (mobile) => {
    if (!dbClient) return { error: 'Database not initialized' };
    try {
      const { data, error } = await dbClient
        .from('orders')
        .select('*')
        .eq('customer_mobile', mobile)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data };
    } catch (e) {
      return { error: e.message };
    }
  }
};

window.OrderManager = OrderManager;

// --- Owner Dashboard Metrics & Queries ---
const DashboardManager = {
  getAllOrders: async () => {
    if (!dbClient) return { error: 'Database not initialized' };
    try {
      const { data, error } = await dbClient
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return { data };
    } catch (e) {
      return { error: e.message };
    }
  },

  getAllCustomers: async () => {
    if (!dbClient) return { error: 'Database not initialized' };
    try {
      const { data, error } = await dbClient
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return { data };
    } catch (e) {
      return { error: e.message };
    }
  },

  updateOrderStatus: async (orderId, newStatus) => {
    if (!dbClient) return { error: 'Database not initialized' };
    try {
      const { data, error } = await dbClient
        .from('orders')
        .update({ order_status: newStatus })
        .eq('id', orderId)
        .select()
        .single();
      if (error) throw error;

      // Trigger status update webhook notification
      await OrderManager.triggerStatusUpdateNotification(data, newStatus);

      return { data };
    } catch (e) {
      return { error: e.message };
    }
  },

  getRevenueMetrics: (orders, customers) => {
    const now = new Date();
    const tzOptions = { year: 'numeric', month: 'numeric', day: 'numeric', timeZone: 'Asia/Kolkata' };
    const todayStr = now.toLocaleDateString('en-US', tzOptions);

    let totalRevenue = 0;
    let revenueToday = 0;
    let ordersToday = 0;
    let ordersPending = 0;
    let ordersCompleted = 0;

    orders.forEach(o => {
      let createdStr = o.created_at;
      if (createdStr && !createdStr.endsWith('Z') && !createdStr.includes('+')) {
        createdStr += 'Z';
      }
      const orderDate = new Date(createdStr);
      const isToday = (orderDate.toLocaleDateString('en-US', tzOptions) === todayStr);

      // Ignore Cancelled orders for revenue calculation
      if (o.order_status !== 'Cancelled') {
        totalRevenue += o.total_amount || 0;
        if (isToday) {
          revenueToday += o.total_amount || 0;
        }
      }

      if (isToday) {
        ordersToday++;
      }

      if (o.order_status === 'Pending') {
        ordersPending++;
      }

      // "Delivered" is the completed status
      if (o.order_status === 'Delivered') {
        ordersCompleted++;
      }
    });

    return {
      totalRevenue,
      revenueToday,
      ordersToday,
      ordersPending,
      ordersCompleted,
      customerCount: customers.length
    };
  },

  getRevenueChartsData: (orders) => {
    const now = new Date();
    const dailyMap = {};
    const weeklyMap = {};
    const monthlyMap = {};

    // Setup last 7 days (in Asia/Kolkata time)
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'Asia/Kolkata' });
      dailyMap[key] = 0;
    }

    // Setup last 6 months (in Asia/Kolkata time)
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit', timeZone: 'Asia/Kolkata' });
      monthlyMap[key] = 0;
    }

    // Setup last 4 weeks
    for (let i = 3; i >= 0; i--) {
      weeklyMap[`Week -${i}`] = 0;
    }

    orders.forEach(o => {
      if (o.order_status === 'Cancelled') return;
      let createdStr = o.created_at;
      if (createdStr && !createdStr.endsWith('Z') && !createdStr.includes('+')) {
        createdStr += 'Z';
      }
      const orderDate = new Date(createdStr);
      const amount = o.total_amount || 0;

      // Daily
      const dayKey = orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'Asia/Kolkata' });
      if (dayKey in dailyMap) {
        dailyMap[dayKey] += amount;
      }

      // Monthly
      const monthKey = orderDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit', timeZone: 'Asia/Kolkata' });
      if (monthKey in monthlyMap) {
        monthlyMap[monthKey] += amount;
      }

      // Weekly
      const diffTime = Math.abs(now - orderDate);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const weekIndex = Math.floor(diffDays / 7);
      if (weekIndex >= 0 && weekIndex < 4) {
        weeklyMap[`Week -${weekIndex}`] += amount;
      }
    });

    const orderedWeekly = {};
    for (let i = 3; i >= 0; i--) {
      orderedWeekly[`Week -${i}`] = weeklyMap[`Week -${i}`] || 0;
    }

    return {
      daily: {
        labels: Object.keys(dailyMap),
        data: Object.values(dailyMap)
      },
      weekly: {
        labels: Object.keys(orderedWeekly).map(w => w === 'Week -0' ? 'This Week' : w.replace('Week -', 'Wks Ago ')),
        data: Object.values(orderedWeekly)
      },
      monthly: {
        labels: Object.keys(monthlyMap),
        data: Object.values(monthlyMap)
      }
    };
  }
};

window.DashboardManager = DashboardManager;

// --- Custom Toast Notifications Helper ---
const Toast = {
  show: (message, isError = false) => {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${isError ? 'toast-error' : ''}`;
    toast.innerHTML = `
      <span>${message}</span>
      <button class="toast-close">&times;</button>
    `;

    container.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 50);

    const closeToast = () => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    };

    toast.querySelector('.toast-close').addEventListener('click', closeToast);

    // Auto dismiss
    setTimeout(closeToast, 4000);
  }
};

window.Toast = Toast;
