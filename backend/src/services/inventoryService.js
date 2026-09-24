const Product = require('../models/Product');
const Notification = require('../models/Notification');

class InventoryService {
  /**
   * Validate if requested quantities are available in stock
   * @param {Array<{ productId: string, quantity: number }>} items
   * @returns {Promise<Array<Object>>} Resolved products with current details
   */
  async validateStock(items) {
    const verifiedProducts = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }

      if (product.status !== 'ACTIVE') {
        throw new Error(`Product "${product.name}" is not currently available for purchase (Status: ${product.status})`);
      }

      if (product.stock < item.quantity) {
        throw new Error(
          `Insufficient stock for "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}`
        );
      }

      verifiedProducts.push({
        product,
        requestedQuantity: item.quantity
      });
    }

    return verifiedProducts;
  }

  /**
   * Decrement stock for purchased items and trigger low-stock alerts
   * @param {Array<{ productId: string, quantity: number }>} items
   * @param {Object} [session] Optional mongoose transaction session
   */
  async decrementStock(items, session = null) {
    for (const item of items) {
      const query = {
        _id: item.productId,
        stock: { $gte: item.quantity }
      };

      const update = {
        $inc: { stock: -item.quantity }
      };

      const options = { new: true };
      if (session) options.session = session;

      const updatedProduct = await Product.findOneAndUpdate(query, update, options);

      if (!updatedProduct) {
        throw new Error(`Stock deduction failed for product ID ${item.productId}. Insufficient stock or concurrent purchase.`);
      }

      // Check if stock became 0 -> update status to OUT_OF_STOCK
      if (updatedProduct.stock === 0) {
        updatedProduct.status = 'OUT_OF_STOCK';
        await updatedProduct.save({ session: session || undefined });
      }

      // Low stock notification if stock <= 5
      if (updatedProduct.stock <= 5) {
        try {
          const Seller = require('../models/Seller');
          const seller = await Seller.findById(updatedProduct.sellerId);
          if (seller) {
            await Notification.create({
              userId: seller.userId,
              title: 'Low Stock Alert',
              message: `Product "${updatedProduct.name}" is running low on stock. Current inventory: ${updatedProduct.stock}`,
              type: 'LOW_STOCK',
              relatedEntity: 'Product',
              relatedEntityId: updatedProduct._id
            });
          }
        } catch (notifErr) {
          console.error('[InventoryService] Low stock notification error:', notifErr.message);
        }
      }
    }
  }

  /**
   * Restore stock on order cancellation or returns
   * @param {Array<{ productId: string, quantity: number }>} items
   * @param {Object} [session] Optional mongoose transaction session
   */
  async restoreStock(items, session = null) {
    for (const item of items) {
      const options = { new: true };
      if (session) options.session = session;

      const product = await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: item.quantity } },
        options
      );

      if (product && product.status === 'OUT_OF_STOCK' && product.stock > 0) {
        product.status = 'ACTIVE';
        await product.save({ session: session || undefined });
      }
    }
  }

  /**
   * Get inventory summary for a seller
   * @param {string} sellerId
   * @param {Object} options - { page, limit, filter }
   */
  async getSellerInventory(sellerId, { page = 1, limit = 10, filter = 'all' } = {}) {
    const query = { sellerId };

    if (filter === 'low_stock') {
      query.stock = { $gt: 0, $lte: 5 };
    } else if (filter === 'out_of_stock') {
      query.stock = 0;
    }

    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      Product.find(query).skip(skip).limit(limit).sort({ stock: 1 }),
      Product.countDocuments(query)
    ]);

    const outOfStockCount = await Product.countDocuments({ sellerId, stock: 0 });
    const lowStockCount = await Product.countDocuments({ sellerId, stock: { $gt: 0, $lte: 5 } });
    const totalProducts = await Product.countDocuments({ sellerId });

    return {
      products: products.map((p) => ({
        _id: p._id,
        name: p.name,
        price: p.price,
        stock: p.stock,
        status: p.status,
        isLowStock: p.stock > 0 && p.stock <= 5,
        isOutOfStock: p.stock === 0
      })),
      summary: {
        totalProducts,
        lowStockCount,
        outOfStockCount,
        inStockCount: totalProducts - outOfStockCount
      },
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  }
}

module.exports = new InventoryService();
