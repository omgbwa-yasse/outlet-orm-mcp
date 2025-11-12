import { Model } from 'outlet-orm';
import User from './User.js';

export default class Profile extends Model {
  static table = 'profiles';

  static fillable = ['user_id', 'bio', 'avatar', 'website'];

  static casts = {
    created_at: 'datetime',
    updated_at: 'datetime'
  };

  static timestamps = true;

  // Relations
  user() {
    return this.belongsTo(User, 'user_id', 'id');
  }
}
