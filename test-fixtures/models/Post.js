import { Model } from 'outlet-orm';
import User from './User.js';

export default class Post extends Model {
  static table = 'posts';

  static fillable = ['title', 'content', 'user_id', 'published_at'];

  static casts = {
    published_at: 'datetime',
    created_at: 'datetime',
    updated_at: 'datetime'
  };

  static timestamps = true;

  // Relations
  user() {
    return this.belongsTo(User, 'user_id', 'id');
  }
}
