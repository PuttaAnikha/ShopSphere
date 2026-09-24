const User = require('../src/models/User');
const Seller = require('../src/models/Seller');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');
const { generateToken } = require('../src/utils/generateToken');

const createTestUser = async ({
  name = 'Test User',
  email = `test_${Date.now()}_${Math.random().toString(36).substring(7)}@example.com`,
  password = 'Password123!',
  role = 'CUSTOMER',
  status = 'ACTIVE'
} = {}) => {
  const user = await User.create({
    name,
    email,
    password,
    role,
    status,
    phone: '9876543210',
    address: { street: '123 Test St', city: 'Test City', state: 'Test State', postalCode: '123456' }
  });

  const token = generateToken({ id: user._id, role: user.role });
  return { user, token };
};

const createTestSeller = async ({
  user = null,
  storeName = 'Test Electronics Store',
  approvalStatus = 'APPROVED'
} = {}) => {
  let sellerUser = user;
  if (!sellerUser) {
    const created = await createTestUser({ role: 'SELLER' });
    sellerUser = created.user;
  }

  const seller = await Seller.create({
    userId: sellerUser._id,
    storeName,
    description: 'Test seller store description',
    phone: '9876543210',
    approvalStatus,
    rating: 4.5
  });

  const token = generateToken({ id: sellerUser._id, role: sellerUser.role });
  return { seller, user: sellerUser, token };
};

const createTestCategory = async ({ name = 'Electronics' } = {}) => {
  return Category.create({
    name: `${name}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    description: 'Electronics test category'
  });
};

const createTestProduct = async ({
  seller,
  category,
  name = 'Smart Laptop',
  price = 50000,
  stock = 10,
  discount = 0,
  status = 'ACTIVE'
}) => {
  return Product.create({
    sellerId: seller._id,
    categoryId: category._id,
    name,
    description: 'High performance testing device',
    price,
    stock,
    discount,
    status
  });
};

module.exports = {
  createTestUser,
  createTestSeller,
  createTestCategory,
  createTestProduct
};
