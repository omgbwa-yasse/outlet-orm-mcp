import User from '../models/User.js';

export default class UserController {
  // List all users
  async index(req, res) {
    try {
      const users = await User.query()
        .with('posts')
        .paginate(req.query.page || 1, 15);
      
      return res.json(users);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Get a single user
  async show(req, res) {
    try {
      const user = await User.find(req.params.id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      return res.json(user);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Create a new user
  async store(req, res) {
    try {
      const user = await User.create(req.body);
      return res.status(201).json(user);
    } catch (error) {
      return res.status(422).json({ error: error.message });
    }
  }

  // Update a user
  async update(req, res) {
    try {
      const user = await User.find(req.params.id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      await user.update(req.body);
      return res.json(user);
    } catch (error) {
      return res.status(422).json({ error: error.message });
    }
  }

  // Delete a user
  async destroy(req, res) {
    try {
      const user = await User.find(req.params.id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      await user.delete();
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}
