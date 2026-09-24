const mongoose = require('mongoose');
const crypto = require('crypto');
const env = require('../config/env');
const { connectDB, disconnectDB } = require('../config/db');

// Import all models
const User = require('../models/User');
const Seller = require('../models/Seller');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Wishlist = require('../models/Wishlist');
const Review = require('../models/Review');
const Coupon = require('../models/Coupon');
const Notification = require('../models/Notification');
const SupportTicket = require('../models/SupportTicket');
const Dispute = require('../models/Dispute');
const Delivery = require('../models/Delivery');
const Settlement = require('../models/Settlement');
const Refund = require('../models/Refund');
const AuditLog = require('../models/AuditLog');
const UserActivity = require('../models/UserActivity');

const seedData = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await connectDB();

    console.log('[Seed] Clearing existing marketplace data...');
    await Promise.all([
      User.deleteMany({}),
      Seller.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Cart.deleteMany({}),
      Order.deleteMany({}),
      OrderItem.deleteMany({}),
      Wishlist.deleteMany({}),
      Review.deleteMany({}),
      Coupon.deleteMany({}),
      Notification.deleteMany({}),
      SupportTicket.deleteMany({}),
      Dispute.deleteMany({}),
      Delivery.deleteMany({}),
      Settlement.deleteMany({}),
      Refund.deleteMany({}),
      AuditLog.deleteMany({}),
      UserActivity.deleteMany({})
    ]);

    console.log('[Seed] Creating demo users...');
    const defaultPassword = 'Password123!';

    const adminUser = await User.create({
      name: 'Super Admin',
      email: 'admin@shopsphere.com',
      password: defaultPassword,
      phone: '+91 98765 00001',
      role: 'ADMIN',
      status: 'ACTIVE',
      address: { street: '100 Tech Park', city: 'Bengaluru', state: 'Karnataka', postalCode: '560001', country: 'India' }
    });

    const sellerUser1 = await User.create({
      name: 'Vikram Mehta',
      email: 'techhub@shopsphere.com',
      password: defaultPassword,
      phone: '+91 98765 00002',
      role: 'SELLER',
      status: 'ACTIVE',
      address: { street: '42 Silicon Avenue', city: 'Bengaluru', state: 'Karnataka', postalCode: '560100', country: 'India' }
    });

    const sellerUser2 = await User.create({
      name: 'Pooja Kapoor',
      email: 'urbanstyle@shopsphere.com',
      password: defaultPassword,
      phone: '+91 98765 00003',
      role: 'SELLER',
      status: 'ACTIVE',
      address: { street: '18 Fashion Boulevard', city: 'Mumbai', state: 'Maharashtra', postalCode: '400050', country: 'India' }
    });

    const sellerUser3 = await User.create({
      name: 'Rahul Verma',
      email: 'freshgadgets@shopsphere.com',
      password: defaultPassword,
      phone: '+91 98765 00004',
      role: 'SELLER',
      status: 'ACTIVE',
      address: { street: '77 Commerce Hub', city: 'Delhi', state: 'Delhi', postalCode: '110001', country: 'India' }
    });

    const customerUser1 = await User.create({
      name: 'Aarav Patel',
      email: 'customer@shopsphere.com',
      password: defaultPassword,
      phone: '+91 98765 00005',
      role: 'CUSTOMER',
      status: 'ACTIVE',
      address: { street: '12 Green Meadows', city: 'Pune', state: 'Maharashtra', postalCode: '411001', country: 'India' }
    });

    const customerUser2 = await User.create({
      name: 'Anita Sharma',
      email: 'anita.sharma@example.com',
      password: defaultPassword,
      phone: '+91 98765 00006',
      role: 'CUSTOMER',
      status: 'ACTIVE',
      address: { street: '55 Sunshine Residency', city: 'Hyderabad', state: 'Telangana', postalCode: '500001', country: 'India' }
    });

    const supportUser = await User.create({
      name: 'David Support',
      email: 'support@shopsphere.com',
      password: defaultPassword,
      phone: '+91 98765 00007',
      role: 'SUPPORT_AGENT',
      status: 'ACTIVE'
    });

    const deliveryUser = await User.create({
      name: 'Ramesh Express',
      email: 'delivery@shopsphere.com',
      password: defaultPassword,
      phone: '+91 98765 00008',
      role: 'DELIVERY_PARTNER',
      status: 'ACTIVE'
    });

    console.log('[Seed] Creating seller profiles...');
    const seller1 = await Seller.create({
      userId: sellerUser1._id,
      storeName: 'TechHub Electronics',
      description: 'Your premium source for cutting-edge computing, mobile, and smart gadgets.',
      phone: '+91 98765 00002',
      address: sellerUser1.address,
      approvalStatus: 'APPROVED',
      rating: 4.8,
      ratingCount: 15,
      businessInfo: {
        taxId: 'GSTIN29ABCDE1234F1Z5',
        registrationNumber: 'REG-TH-2024-88',
        bankAccount: {
          accountHolderName: 'TechHub Electronics LLP',
          accountNumber: '998877665544',
          bankName: 'HDFC Bank',
          ifscCode: 'HDFC0001234'
        }
      }
    });

    const seller2 = await Seller.create({
      userId: sellerUser2._id,
      storeName: 'UrbanStyle Apparel',
      description: 'Contemporary urban streetwear, designer jackets, and artisan fashion wear.',
      phone: '+91 98765 00003',
      address: sellerUser2.address,
      approvalStatus: 'APPROVED',
      rating: 4.6,
      ratingCount: 22,
      businessInfo: {
        taxId: 'GSTIN27XYZPQ5678R1Z2',
        registrationNumber: 'REG-US-2024-91',
        bankAccount: {
          accountHolderName: 'UrbanStyle Apparel Pvt Ltd',
          accountNumber: '112233445566',
          bankName: 'ICICI Bank',
          ifscCode: 'ICIC0005678'
        }
      }
    });

    const seller3 = await Seller.create({
      userId: sellerUser3._id,
      storeName: 'FreshGadgets Store',
      description: 'Innovative everyday gadgets, power accessories, and cables.',
      phone: '+91 98765 00004',
      address: sellerUser3.address,
      approvalStatus: 'PENDING',
      rating: 0
    });

    console.log('[Seed] Creating categories...');
    const categoryElectronics = await Category.create({
      name: 'Electronics',
      description: 'Laptops, mobile devices, audio gear, and peripherals.',
      image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c'
    });

    const categoryFashion = await Category.create({
      name: 'Fashion & Apparel',
      description: 'Trendy clothing, leather accessories, and footwear.',
      image: 'https://images.unsplash.com/photo-1445205170230-053b83016050'
    });

    const categoryHome = await Category.create({
      name: 'Home & Kitchen',
      description: 'Smart appliances, decor, cookware, and ergonomics.',
      image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f'
    });

    const categoryFitness = await Category.create({
      name: 'Sports & Outdoors',
      description: 'Fitness trackers, outdoor gear, and apparel.',
      image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd'
    });

    console.log('[Seed] Creating products...');
    const prod1 = await Product.create({
      sellerId: seller1._id,
      categoryId: categoryElectronics._id,
      name: 'UltraBook Pro 15 - 16GB RAM 512GB SSD',
      description: 'High performance ultra-slim laptop engineered for developers, designers, and creators with 14-hour all-day battery life.',
      price: 64999,
      discount: 10,
      brand: 'NovaTech',
      stock: 25,
      images: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853'],
      specifications: { Processor: 'Intel Core i7 13th Gen', RAM: '16GB DDR5', Storage: '512GB NVMe SSD', Screen: '15.6 inch FHD IPS' },
      rating: 4.8,
      reviewCount: 8,
      status: 'ACTIVE'
    });

    const prod2 = await Product.create({
      sellerId: seller1._id,
      categoryId: categoryElectronics._id,
      name: 'SonicWave Wireless Noise-Cancelling Headphones',
      description: 'Immersive sound with 40mm neodymium dynamic drivers, active hybrid noise cancellation, and 45h playtime.',
      price: 4999,
      discount: 15,
      brand: 'SonicWave',
      stock: 50,
      images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e'],
      specifications: { Connectivity: 'Bluetooth 5.3', BatteryLife: '45 Hours', ANC: 'Hybrid Active Noise Cancelling' },
      rating: 4.6,
      reviewCount: 5,
      status: 'ACTIVE'
    });

    const prod3 = await Product.create({
      sellerId: seller1._id,
      categoryId: categoryElectronics._id,
      name: 'SpeedDrive 1TB External NVMe SSD',
      description: 'Blazing fast USB 3.2 Gen 2 transfer speeds up to 1050MB/s in an ultra-compact rugged aluminum chassis.',
      price: 6499,
      discount: 5,
      brand: 'NovaTech',
      stock: 3, // Low stock product!
      images: ['https://images.unsplash.com/photo-1597872200969-2b65d56bd16b'],
      specifications: { Interface: 'USB-C 3.2 Gen 2', Speed: '1050 MB/s', Capacity: '1TB' },
      rating: 4.7,
      reviewCount: 2,
      status: 'ACTIVE'
    });

    const prod4 = await Product.create({
      sellerId: seller2._id,
      categoryId: categoryFashion._id,
      name: 'Urban Maverick Heavyweight Cotton Hoodie',
      description: 'Crafted from 450 GSM French terry cotton with custom distressed wash and double-stitched kangaroo pocket.',
      price: 2499,
      discount: 20,
      brand: 'UrbanStyle',
      stock: 40,
      images: ['https://images.unsplash.com/photo-1556905055-8f358a7a47b2'],
      specifications: { Material: '100% French Terry Cotton', Weight: '450 GSM', Fit: 'Relaxed Drop Shoulder' },
      rating: 4.9,
      reviewCount: 11,
      status: 'ACTIVE'
    });

    const prod5 = await Product.create({
      sellerId: seller2._id,
      categoryId: categoryFashion._id,
      name: 'Artisan Full-Grain Leather Weekender Bag',
      description: 'Handcrafted genuine vegetable-tanned leather duffle with dedicated shoe compartment and brass hardware.',
      price: 7999,
      discount: 0,
      brand: 'UrbanStyle',
      stock: 12,
      images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62'],
      specifications: { Material: 'Full Grain Buffalo Leather', Hardware: 'Antique Brass', Capacity: '45 Liters' },
      rating: 4.5,
      reviewCount: 3,
      status: 'ACTIVE'
    });

    const prod6 = await Product.create({
      sellerId: seller2._id,
      categoryId: categoryFashion._id,
      name: 'Retro Classic Canvas Low-Top Sneakers',
      description: 'Everyday vulcanized sneakers featuring ortholite cushioned insoles and high-grip rubber outsoles.',
      price: 1899,
      discount: 10,
      brand: 'UrbanStyle',
      stock: 0, // OUT OF STOCK
      images: ['https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77'],
      specifications: { Upper: 'Heavy Canvas', Sole: 'Vulcanized Rubber', Insole: 'Ortholite Cushion' },
      rating: 4.4,
      reviewCount: 7,
      status: 'OUT_OF_STOCK'
    });

    console.log('[Seed] Creating discount coupons...');
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + 90);

    const coupon1 = await Coupon.create({
      code: 'WELCOME50',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderAmount: 1000,
      maxDiscount: 500,
      startDate: now,
      expiryDate: futureDate,
      usageLimit: 100,
      usedCount: 5,
      active: true
    });

    const coupon2 = await Coupon.create({
      code: 'FLAT100',
      discountType: 'FIXED',
      discountValue: 100,
      minOrderAmount: 500,
      startDate: now,
      expiryDate: futureDate,
      usageLimit: 500,
      usedCount: 12,
      active: true
    });

    console.log('[Seed] Creating customer cart & wishlist...');
    await Cart.create({
      userId: customerUser1._id,
      items: [
        {
          productId: prod2._id,
          sellerId: seller1._id,
          quantity: 1,
          price: 4249
        },
        {
          productId: prod4._id,
          sellerId: seller2._id,
          quantity: 2,
          price: 1999
        }
      ]
    });

    await Wishlist.create({
      userId: customerUser1._id,
      products: [prod1._id, prod5._id]
    });

    console.log('[Seed] Creating sample delivered multi-vendor master order...');
    const orderNumber = 'ORD-202609-1001';
    const sampleOrder = await Order.create({
      customerId: customerUser1._id,
      orderNumber,
      items: [
        {
          productId: prod2._id,
          sellerId: seller1._id,
          productName: prod2.name,
          quantity: 1,
          priceAtPurchase: 4249,
          subtotal: 4249,
          status: 'DELIVERED'
        },
        {
          productId: prod4._id,
          sellerId: seller2._id,
          productName: prod4.name,
          quantity: 1,
          priceAtPurchase: 1999,
          subtotal: 1999,
          status: 'DELIVERED'
        }
      ],
      sellerOrders: [
        {
          sellerId: seller1._id,
          sellerOrderNumber: `${orderNumber}-A`,
          subtotal: 4249,
          shippingAmount: 0,
          status: 'DELIVERED'
        },
        {
          sellerId: seller2._id,
          sellerOrderNumber: `${orderNumber}-B`,
          subtotal: 1999,
          shippingAmount: 0,
          status: 'DELIVERED'
        }
      ],
      subtotal: 6248,
      discount: 100,
      shippingAmount: 0,
      totalAmount: 6148,
      couponCode: 'FLAT100',
      couponId: coupon2._id,
      shippingAddress: { ...customerUser1.address.toObject(), phone: customerUser1.phone },
      paymentMethod: 'ONLINE_DEMO',
      paymentStatus: 'SUCCESSFUL',
      paymentDetails: { transactionId: `DEMO-${crypto.randomBytes(4).toString('hex').toUpperCase()}`, paidAt: now },
      orderStatus: 'DELIVERED'
    });

    // Create OrderItem records
    await OrderItem.create([
      {
        orderId: sampleOrder._id,
        productId: prod2._id,
        sellerId: seller1._id,
        productName: prod2.name,
        quantity: 1,
        priceAtPurchase: 4249,
        subtotal: 4249,
        status: 'DELIVERED'
      },
      {
        orderId: sampleOrder._id,
        productId: prod4._id,
        sellerId: seller2._id,
        productName: prod4.name,
        quantity: 1,
        priceAtPurchase: 1999,
        subtotal: 1999,
        status: 'DELIVERED'
      }
    ]);

    // Create Settlements
    await Settlement.create([
      {
        sellerId: seller1._id,
        orderId: sampleOrder._id,
        grossAmount: 4249,
        platformCommission: 425,
        refundAdjustment: 0,
        netAmount: 3824,
        status: 'SETTLED',
        settledAt: now,
        transactionReference: 'SETTLE-TH-1001'
      },
      {
        sellerId: seller2._id,
        orderId: sampleOrder._id,
        grossAmount: 1999,
        platformCommission: 200,
        refundAdjustment: 0,
        netAmount: 1799,
        status: 'SETTLED',
        settledAt: now,
        transactionReference: 'SETTLE-US-1001'
      }
    ]);

    // Create Delivery
    await Delivery.create({
      orderId: sampleOrder._id,
      deliveryPartnerId: deliveryUser._id,
      trackingNumber: 'TRK-202609-9901',
      status: 'DELIVERED',
      deliveredAt: now
    });

    // Create verified review for delivered product
    await Review.create({
      userId: customerUser1._id,
      productId: prod2._id,
      orderId: sampleOrder._id,
      rating: 5,
      comment: 'Exceptional noise cancellation and supreme sound clarity. Completely worth the price!',
      verifiedPurchase: true,
      status: 'ACTIVE'
    });

    // Create notifications
    await Notification.create([
      {
        userId: customerUser1._id,
        title: 'Order Delivered',
        message: `Your order ${orderNumber} was delivered successfully. Enjoy your items!`,
        type: 'ORDER_DELIVERED',
        relatedEntity: 'Order',
        relatedEntityId: sampleOrder._id
      },
      {
        userId: sellerUser1._id,
        title: 'New Order Received',
        message: `You received order ${orderNumber}-A for SonicWave Headphones.`,
        type: 'ORDER_PLACED',
        relatedEntity: 'Order',
        relatedEntityId: sampleOrder._id
      }
    ]);

    console.log('[Seed] Database seeding completed successfully!');
    console.log('==================================================');
    console.log('  DEMO CREDENTIALS:');
    console.log('  Admin:            admin@shopsphere.com       / Password123!');
    console.log('  Seller (Approved):techhub@shopsphere.com     / Password123!');
    console.log('  Seller (Approved):urbanstyle@shopsphere.com  / Password123!');
    console.log('  Seller (Pending): freshgadgets@shopsphere.com/ Password123!');
    console.log('  Customer:         customer@shopsphere.com    / Password123!');
    console.log('  Support Agent:    support@shopsphere.com     / Password123!');
    console.log('  Delivery Partner: delivery@shopsphere.com    / Password123!');
    console.log('==================================================');

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedData();
