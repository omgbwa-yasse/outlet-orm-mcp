export async function up(schema) {
  await schema.createTable('posts', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.string('title', 255).notNullable();
    table.text('content');
    table.foreign('user_id').references('users.id').onDelete('CASCADE');
    table.timestamps();
  });
}

export async function down(schema) {
  await schema.dropTable('posts');
}
