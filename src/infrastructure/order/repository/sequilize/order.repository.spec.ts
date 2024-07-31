import { Sequelize } from "sequelize-typescript";
import Order from "../../../../domain/checkout/entity/order";
import OrderItem from "../../../../domain/checkout/entity/order_item";
import Customer from "../../../../domain/customer/entity/customer";
import Address from "../../../../domain/customer/value-object/address";
import Product from "../../../../domain/product/entity/product";
import CustomerModel from "../../../customer/repository/sequelize/customer.model";
import CustomerRepository from "../../../customer/repository/sequelize/customer.repository";
import ProductModel from "../../../product/repository/sequelize/product.model";
import ProductRepository from "../../../product/repository/sequelize/product.repository";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";
import OrderRepository from "./order.repository";

describe("Order repository test", () => {
  let sequelize: Sequelize;

  beforeEach(async () => {
    sequelize = new Sequelize({
      dialect: "sqlite",
      storage: ":memory:",
      logging: false,
      sync: { force: true },
    });

    await sequelize.addModels([
      CustomerModel,
      OrderModel,
      OrderItemModel,
      ProductModel,
    ]);
    await sequelize.sync();
  });

  afterEach(async () => {
    await sequelize.close();
  });

  it("should update a order", async () => {
    const customerRepository = new CustomerRepository();
    const customer = new Customer("123", "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.changeAddress(address);
    await customerRepository.create(customer);

    const productRepository = new ProductRepository();
    const product1 = new Product("product1", "Product 1", 10);
    await productRepository.create(product1);

    const product2 = new Product("product2", "Product 2", 20);
    await productRepository.create(product2);

    const orderItem1 = new OrderItem(
      "orderItem1",
      product1.name,
      product1.price,
      product1.id,
      2
    );
    const orderRepository = new OrderRepository();
    const order1 = new Order("order1", customer.id, [orderItem1]);
    await orderRepository.create(order1);

    const orderItem2 = new OrderItem(
      "orderItem2",
      product2.name,
      product2.price,
      product2.id,
      1
    );

    order1.changeItems([orderItem1, orderItem2]);
    await orderRepository.update(order1);
    
    const orderModel = await OrderModel.findOne({where: {id : order1.id}, include: ["items"]});
    expect(orderModel.toJSON()).toStrictEqual({
      id: order1.id,
      customer_id: customer.id,
      total: order1.total(),
      items: [
        {
          id: orderItem1.id,
          name: orderItem1.name,
          price: orderItem1.price,
          quantity: orderItem1.quantity,
          order_id: order1.id,
          product_id: orderItem1.productId,
        },
        {
          id: orderItem2.id,
          name: orderItem2.name,
          price: orderItem2.price,
          quantity: orderItem2.quantity,
          order_id: order1.id,
          product_id: orderItem2.productId,
        },
      ],
    });
  });

  it("should find all orders", async() => {
    const customerRepository = new CustomerRepository();
    const customer = new Customer("123", "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.changeAddress(address);
    await customerRepository.create(customer);

    const productRepository = new ProductRepository();
    const product = new Product("123", "Product 1", 10);
    await productRepository.create(product);

    const orderItem1 = new OrderItem(
      "orderItem1",
      product.name,
      product.price,
      product.id,
      2
    );

    const order1 = new Order("order1", customer.id, [orderItem1]);

    const orderRepository = new OrderRepository();
    await orderRepository.create(order1);

    const orders1 = await orderRepository.findAll();
    expect(orders1).toHaveLength(1);
    expect(orders1).toContainEqual(order1);

    const orderItem2 = new OrderItem(
      "orderItem2",
      product.name,
      product.price,
      product.id,
      1
    );

    const order2 = new Order("order2", customer.id, [orderItem2]);
    await orderRepository.create(order2);

    const orders2 = await orderRepository.findAll();
    expect(orders2).toHaveLength(2);
    expect(orders2).toContainEqual(order1);
    expect(orders2).toContainEqual(order2);
  });

  it('should throw an error when order is not found', async () => {
    const orderRepository = new OrderRepository();
    expect(async () => {
      await orderRepository.find('notFound');
    }).rejects.toThrow("Order not found");
  });
  it("should find a order", async () => {

    const customerRepository = new CustomerRepository();
    const customer = new Customer("customerId", "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.changeAddress(address);
    await customerRepository.create(customer);

    const productRepository = new ProductRepository();
    const product = new Product("productId", "Product 1", 10);
    await productRepository.create(product);

    const orderItem = new OrderItem(
      "orderItemId",
      product.name,
      product.price,
      product.id,
      2
    );

    const orderRepository = new OrderRepository();
    const order = new Order("orderId", customer.id, [orderItem]);
    await orderRepository.create(order);
    
    const orderResult = await orderRepository.find(order.id);
    expect(order).toStrictEqual(orderResult);
  });

  it("should create a new order", async () => {
    const customerRepository = new CustomerRepository();
    const customer = new Customer("123", "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.changeAddress(address);
    await customerRepository.create(customer);

    const productRepository = new ProductRepository();
    const product = new Product("123", "Product 1", 10);
    await productRepository.create(product);

    const orderItem = new OrderItem(
      "1",
      product.name,
      product.price,
      product.id,
      2
    );

    const order = new Order("123", "123", [orderItem]);

    const orderRepository = new OrderRepository();
    await orderRepository.create(order);

    const orderModel = await OrderModel.findOne({
      where: { id: order.id },
      include: ["items"],
    });

    expect(orderModel.toJSON()).toStrictEqual({
      id: "123",
      customer_id: "123",
      total: order.total(),
      items: [
        {
          id: orderItem.id,
          name: orderItem.name,
          price: orderItem.price,
          quantity: orderItem.quantity,
          order_id: "123",
          product_id: "123",
        },
      ],
    });
  });
});
