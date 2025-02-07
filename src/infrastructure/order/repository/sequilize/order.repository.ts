import Order from "../../../../domain/checkout/entity/order";
import OrderItem from "../../../../domain/checkout/entity/order_item";
import OrderRepositoryInterface from "../../../../domain/checkout/repository/order-repository.interface";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";

export default class OrderRepository implements OrderRepositoryInterface{

  async update(entity: Order): Promise<void> {
    const sequelize = OrderModel.sequelize;

    await sequelize.transaction(async (transaction) => {
      await OrderItemModel.destroy({
        where: { order_id: entity.id },
        transaction: transaction,
      });

      const items = entity.items.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        product_id: item.productId,
        quantity: item.quantity,
        order_id: entity.id,
      }));

      await OrderItemModel.bulkCreate(items, { transaction: transaction });

      await OrderModel.update(
        { total: entity.total() },
        { where: { id: entity.id }, transaction: transaction }
      );
    });

  }

  async find(id: string): Promise<Order> {
    let orderModel;
    try {
      orderModel = await OrderModel.findOne({
        where: {
          id,
        },
        rejectOnEmpty: true,
        include: ["items"]
      })  
    } catch (error) {
      throw new Error("Order not found.")
    }


    return new Order(orderModel.id, orderModel.customer_id, orderModel.items.map((item) => 
                        new OrderItem( item.id, item.name, item.price, item.product_id, item.quantity)
                     ));
  }

  async findAll(): Promise<Order[]> {
    const orderModels = await OrderModel.findAll({
      include: ["items"]
    });

    console.log(orderModels);

    
    const orders = orderModels.map( (orderModel) => {
      let order = new Order(orderModel.id, orderModel.customer_id, orderModel.items.map((item) =>{
        return new OrderItem(item.id, item.name, item.price, item.product_id, item.quantity);
      }))
      return order;
    });
      
    return orders;
  }

  async create(entity: Order): Promise<void> {
      await OrderModel.create(
        {
          id: entity.id,
          customer_id: entity.customerId,
          total: entity.total(),
          items: entity.items.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            product_id: item.productId,
            quantity: item.quantity,
          })),
        },
        {
          include: [{ model: OrderItemModel }],
        }
      );
  }

}
