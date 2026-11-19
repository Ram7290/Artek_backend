/**
 * Blog post model.
 *
 * `content` is plain text: "## " starts a heading, "### " a sub-heading, "- "
 * a list item, and every other line is a paragraph (see utils/blog-content.js).
 * Only `status: "published"` posts are exported to the public site.
 */
export default function (sequelize, DataTypes) {
  return sequelize.define(
    "BlogPost",
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      slug: { type: DataTypes.STRING(120), allowNull: false, unique: true },
      title: { type: DataTypes.STRING(200), allowNull: false },
      dek: { type: DataTypes.STRING(300), allowNull: false, defaultValue: "" },
      category: { type: DataTypes.STRING(80), allowNull: false },
      authorId: { type: DataTypes.STRING(60), allowNull: false, defaultValue: "artek-team" },
      content: { type: DataTypes.TEXT, allowNull: false, defaultValue: "" },
      coverImage: { type: DataTypes.STRING(300), allowNull: true },
      coverAlt: { type: DataTypes.STRING(200), allowNull: true },
      seoTitle: { type: DataTypes.STRING(120), allowNull: true },
      seoDescription: { type: DataTypes.STRING(300), allowNull: true },
      status: {
        type: DataTypes.ENUM("draft", "published"),
        allowNull: false,
        defaultValue: "draft",
      },
      featured: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      publishedAt: { type: DataTypes.DATEONLY, allowNull: true },
    },
    { tableName: "blog_posts" },
  );
}
