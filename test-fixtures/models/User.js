import { Model } from 'outlet-orm';
import Post from './Post.js';
import Profile from './Profile.js';

export default class User extends Model {
  static table = 'users';

  static fillable = ['name', 'email', 'role'];

  static casts = {
    is_active: 'boolean',
    created_at: 'datetime',
    updated_at: 'datetime'
  };

  static timestamps = true;
  static softDeletes = false;

  // Relations
  posts() {
    return this.hasMany(Post, 'user_id', 'id');
  }

  profile() {
    return this.hasOne(Profile, 'user_id', 'id');
  }
}
