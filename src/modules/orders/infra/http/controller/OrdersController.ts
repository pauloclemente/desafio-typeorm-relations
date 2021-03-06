import { Request, Response } from 'express';

import { container } from 'tsyringe';

import CreateOrderService from '@modules/orders/services/CreateOrderService';
import FindOrderService from '@modules/orders/services/FindOrderService';

export default class OrdersController {
  public async show(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    const findOrder = container.resolve(FindOrderService);
    const order = await findOrder.execute({
      id,
    });
    return response.json(order);
  }

  public async create(request: Request, response: Response): Promise<Response> {
    const { customer_id, products } = request.body;

    const createOrder = await container.resolve(CreateOrderService);

    const customer = await createOrder.execute({
      customer_id,
      products,
    });
    return response.status(400).json(customer);
    // TODO
  }
}
