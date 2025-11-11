export async function up(schema) {
  await schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.string('email', 255).notNullable().unique();
    table.string('password', 255).notNullable();
    table.string('role', 50).defaultTo('user');
    table.boolean('is_active').defaultTo(true);
    table.timestamps();
  });
}

export async function down(schema) {
  await schema.dropTable('users');
}
