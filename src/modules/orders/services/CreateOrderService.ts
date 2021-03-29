import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';
import IUpdateProductsQuantityDTO from '../../products/dtos/IUpdateProductsQuantityDTO';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const costumer = await this.customersRepository.findById(customer_id);
    if (!costumer) {
      throw new AppError('');
    }
    const productsIds_stored = products.map(item => ({ id: item.id }));
    const stored_products = await this.productsRepository.findAllById(
      productsIds_stored,
    );
    if (productsIds_stored.length !== products.length) {
      throw new AppError('e');
    }
    const update_quantities: IUpdateProductsQuantityDTO[] = [];
    const update_products = stored_products.map(found_item => {
      const ordered_products = products.find(
        product => product.id === found_item.id,
      );
      if (ordered_products) {
        if (found_item.quantity < ordered_products.quantity) {
          throw new AppError(
            `Product ${found_item.name} has this quantity ${found_item.quantity} available in stock\n
            and you requested ${ordered_products.quantity}`,
          );
        }
        update_quantities.push({
          id: ordered_products.id,
          quantity: found_item.quantity - ordered_products.quantity,
        });
        return {
          ...found_item,
          quantity: ordered_products.quantity,
        };
      }
      return found_item;
    });
    await this.productsRepository.updateQuantity(update_quantities);
    const order = this.ordersRepository.create({
      customer: costumer,
      products: update_products.map(item => ({
        product_id: item.id,
        price: item.price,
        quantity: item.quantity,
      })),
    });
    return order;
  }
}

export default CreateOrderService;
