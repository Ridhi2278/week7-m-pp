const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");
const connectDB = require("../config/db");
const Product = require("../models/productModel");

const api = supertest(app);

// starting data jo har test se pehle database me jayega
const startProducts = [
  {
    title: "Gaming Headset",
    category: "Electronics",
    description: "Headset with mic and soft ear cushions.",
    price: 59.5,
    stockQuantity: 60,
    supplier: {
      name: "GameGear Oy",
      contactEmail: "hello@gamegear.example",
      contactPhone: "+358401230001",
      rating: 4,
    },
  },
  {
    title: "Bookshelf",
    category: "Furniture",
    description: "Wooden bookshelf with five shelves.",
    price: 89.9,
    stockQuantity: 15,
    supplier: {
      name: "WoodWorks Ltd.",
      contactEmail: "sales@woodworks.example",
      contactPhone: "+358409870002",
      rating: 5,
    },
  },
];

beforeAll(async () => {
  await connectDB();
});

beforeEach(async () => {
  await Product.deleteMany({});
  await Product.insertMany(startProducts);
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("GET /api/products", () => {
  it("should return all products", async () => {
    const res = await api.get("/api/products").expect(200);

    expect(res.body).toHaveLength(startProducts.length);
  });

  it("should return products as JSON with status 200", async () => {
    await api
      .get("/api/products")
      .expect(200)
      .expect("Content-Type", /application\/json/);
  });

  it("should include a specific product in the returned list", async () => {
    const res = await api.get("/api/products");

    const titles = res.body.map((p) => p.title);
    expect(titles).toContain("Gaming Headset");
  });
});

describe("POST /api/products", () => {
  describe("when the payload is valid", () => {
    it("should return status 201", async () => {
      const laptop = {
        title: "Laptop Stand",
        category: "Electronics",
        description: "Foldable aluminium stand for laptops.",
        price: 34.9,
        stockQuantity: 100,
        supplier: {
          name: "DeskMate",
          contactEmail: "info@deskmate.example",
          contactPhone: "+358401230003",
          rating: 4,
        },
      };

      await api.post("/api/products").send(laptop).expect(201);
    });

    it("should persist the new product in the database", async () => {
      const laptop = {
        title: "Laptop Stand",
        category: "Electronics",
        description: "Foldable aluminium stand for laptops.",
        price: 34.9,
        stockQuantity: 100,
        supplier: {
          name: "DeskMate",
          contactEmail: "info@deskmate.example",
          contactPhone: "+358401230003",
          rating: 4,
        },
      };

      await api.post("/api/products").send(laptop).expect(201);

      const allProducts = await Product.find({});
      expect(allProducts).toHaveLength(startProducts.length + 1);

      const titles = allProducts.map((p) => p.title);
      expect(titles).toContain(laptop.title);
    });
  });

  describe("when the payload is invalid", () => {
    it("should return status 400 when title is missing", async () => {
      const badProduct = {
        category: "Furniture",
        description: "This product has no title.",
        price: 20,
        stockQuantity: 5,
        supplier: {
          name: "Test Supplier",
          contactEmail: "test@supplier.example",
          contactPhone: "+358401230004",
          rating: 3,
        },
      };

      await api.post("/api/products").send(badProduct).expect(400);
    });

    it("should not increase the number of products in the database", async () => {
      const badProduct = {
        category: "Furniture",
        description: "This product has no title.",
        price: 20,
        stockQuantity: 5,
        supplier: {
          name: "Test Supplier",
          contactEmail: "test@supplier.example",
          contactPhone: "+358401230004",
          rating: 3,
        },
      };

      await api.post("/api/products").send(badProduct).expect(400);

      const allProducts = await Product.find({});
      expect(allProducts).toHaveLength(startProducts.length);
    });
  });
});

describe("GET /api/products/:productId", () => {
  describe("when the id is valid", () => {
    it("should return one product by ID", async () => {
      const oneProduct = await Product.findOne();

      const res = await api
        .get(`/api/products/${oneProduct._id}`)
        .expect(200)
        .expect("Content-Type", /application\/json/);

      expect(res.body.title).toBe(oneProduct.title);
    });
  });

  describe("when the id does not exist", () => {
    it("should return status 404", async () => {
      const fakeId = new mongoose.Types.ObjectId();

      await api.get(`/api/products/${fakeId}`).expect(404);
    });
  });

  describe("when the id is invalid", () => {
    it("should return status 404", async () => {
      await api.get("/api/products/abc123").expect(404);
    });
  });
});

describe("PUT /api/products/:productId", () => {
  describe("when the id is valid", () => {
    it("should return status 200", async () => {
      const oneProduct = await Product.findOne();

      await api
        .put(`/api/products/${oneProduct._id}`)
        .send({ description: "New updated text", stockQuantity: 99 })
        .expect(200);
    });

    it("should persist the updated fields in the database", async () => {
      const oneProduct = await Product.findOne();
      const changes = {
        description: "New updated text",
        stockQuantity: 99,
      };

      await api.put(`/api/products/${oneProduct._id}`).send(changes).expect(200);

      const afterUpdate = await Product.findById(oneProduct._id);
      expect(afterUpdate.description).toBe(changes.description);
      expect(afterUpdate.stockQuantity).toBe(changes.stockQuantity);
    });
  });

  describe("when the id is invalid", () => {
    it("should return status 404", async () => {
      await api.put("/api/products/abc123").send({}).expect(404);
    });
  });
});

describe("DELETE /api/products/:productId", () => {
  describe("when the id is valid", () => {
    it("should return status 204", async () => {
      const oneProduct = await Product.findOne();

      await api.delete(`/api/products/${oneProduct._id}`).expect(204);
    });

    it("should remove the product from the database", async () => {
      const oneProduct = await Product.findOne();

      await api.delete(`/api/products/${oneProduct._id}`).expect(204);

      const deleted = await Product.findById(oneProduct._id);
      expect(deleted).toBeNull();
    });
  });

  describe("when the id is invalid", () => {
    it("should return status 404", async () => {
      await api.delete("/api/products/abc123").expect(404);
    });
  });
});