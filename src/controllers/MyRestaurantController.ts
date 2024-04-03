import { Request, Response } from 'express';
import cloudinary from 'cloudinary';
import mongoose from 'mongoose';

import Restaurant from '../models/restaurant';
import Order from '../models/order';

const createMyRestaurant = async (req: Request, res: Response) => {
  try {
    // A user can have only one restaurant
    const existingRestaurant = await Restaurant.findOne({ user: req.userId });

    if (existingRestaurant) {
      return res
        .status(409)
        .json({ message: 'User restaurant already exists' });
    }

    const imageUrl = await uploadImage(req.file as Express.Multer.File);

    // Create a new restaurant into the database
    const restaurant = new Restaurant(req.body);
    restaurant.imageUrl = imageUrl;
    // Link the current logged in user to the restaurant
    restaurant.user = new mongoose.Types.ObjectId(req.userId);
    restaurant.lastUpdated = new Date();
    await restaurant.save();

    res.status(201).send(restaurant);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Something went wrong' });
  }
};

const getMyRestaurant = async (req: Request, res: Response) => {
  try {
    const restaurant = await Restaurant.findOne({ user: req.userId });

    if (!restaurant) {
      return res.status(404).json({ message: 'No restaurant found' });
    }
    res.json(restaurant);
  } catch (error) {
    console.log('Error', error);
    res.status(500).json({ message: 'Error fetching restaurant' });
  }
};

const updateMyRestaurant = async (req: Request, res: Response) => {
  try {
    const restaurant = await Restaurant.findOne({ user: req.userId });

    if (!restaurant) {
      return res.status(404).json({ message: 'No restaurant found' });
    }

    restaurant.restaurantName = req.body.restaurantName;
    restaurant.city = req.body.city;
    restaurant.country = req.body.country;
    restaurant.deliveryPrice = req.body.deliveryPrice;
    restaurant.estimatedDeliveryTime = req.body.estimatedDeliveryTime;
    restaurant.cuisines = req.body.cuisines;
    restaurant.menuItems = req.body.menuItems;
    restaurant.lastUpdated = new Date();

    if (req.file) {
      const imageUrl = await uploadImage(req.file as Express.Multer.File);
      restaurant.imageUrl = imageUrl;
    }

    await restaurant.save();
    res.status(200).send(restaurant);
  } catch (error) {
    console.log('Error', error);
    res.status(500).json({ message: 'Something went wrong' });
  }
};

const getMyRestaurantOrders = async (req: Request, res: Response) => {
  try {
    const restaurant = await Restaurant.findOne({ user: req.userId });

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const orders = await Order.find({ restaurant: restaurant._id })
      .populate('restaurant')
      .populate('user');

    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Something went wrong' });
  }
};

const uploadImage = async (file: Express.Multer.File) => {
  // Get the image from memory
  const image = file;
  // Convert the image to base64 string
  const base64Image = Buffer.from(image.buffer).toString('base64');
  // Type mimetype, base64 encoded string
  const dataURI = `data:${image.mimetype};base64,${base64Image}`;

  // Upload the image to Cloudinary
  const uploadResponse = await cloudinary.v2.uploader.upload(dataURI);

  return uploadResponse.url;
};

export default {
  createMyRestaurant,
  getMyRestaurant,
  updateMyRestaurant,
  getMyRestaurantOrders,
};
