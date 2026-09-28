const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");
const connectDB = require("../config/db");
const Product = require("../models/productModel");

const api = supertest(app);

const initialProducts = [
  {
    title: "Bluetooth Speaker",
    category: "Electronics",
    description: "Small portable speaker with clear sound and long battery.",
    price: 49.9,
    stockQuantity: 80,
    supplier: {
      name: "SoundHub Oy",
      contactEmail: "sales@soundhub.example",
      contactPhone: "+358401234500",
      rating: 4,
    },
  },
  {
    title: "Office Chair",
    category: "Furniture",
    description: "Comfortable chair with back support for long study hours.",
    price: 189.5,
    stockQuantity: 25,
    supplier: {
      name: "HomeOffice Ltd.",
      contactEmail: "orders@homeoffice.example",
      contactPhone: "+358409876500",
      rating: 5,
    },
  },
];

beforeAll(async () => {
  await connectDB();
});

beforeEach(async () => {
  await Product.deleteMany({});
  await Product.insertMany(initialProducts);
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("GET /api/products", () => {
  it("should return all products", async () => {
    const response = await api.get("/api/products").expect(200);
    expect(response.body).toHaveLength(initialProducts.length);
  });

  it("should return products as JSON with status 200", async () => {
    await api
      .get("/api/products")
      .expect(200)
      .expect("Content-Type", /application\/json/);
  });

  it("should include a specific product in the returned list", async () => {
    const response = await api.get("/api/products");
    expect(response.body.map((product) => product.title)).toContain(
      "Bluetooth Speaker"
    );
  });
});

describe("POST /api/products", () => {
  describe("when the payload is valid", () => {
    it("should return status 201", async () => {
      const newProduct = {
        title: "iphone",
        category: "18promax",
        description: "latest new realsed version,wine colour",
        price: 2500,
        stockQuantity: 40,
        supplier: {
          name: "apple",
          contactEmail: "aaple@example.com",
          contactPhone: "023465782",
          rating: 5,
        },
      };

      await api.post("/api/products").send(newProduct).expect(201);
    });

    it("should persist the new product in the database", async () => {
      const newProduct = {
        title: "iphone",
        category: "18promax",
        description: "latest new realsed version,wine colour",
        price: 2500,
        stockQuantity: 40,
        supplier: {
          name: "apple",
          contactEmail: "aaple@example.com",
          contactPhone: "023465782",
          rating: 5,
        },
      };

      await api.post("/api/products").send(newProduct).expect(201);

      const productsAfterPost = await Product.find({});
      expect(productsAfterPost).toHaveLength(initialProducts.length + 1);
      expect(productsAfterPost.map((p) => p.title)).toContain(newProduct.title);
    });
  });

  describe("when the payload is invalid", () => {
    it("should return status 400 when title is missing", async () => {
      const invalidProduct = {
        category: "i10",
        description: "latest model 2026 white colour",
        price: 1000,
        stockQuantity: 30,
        supplier: {
          name: "hyundai",
          contactEmail: "hyundai@example.com",
          contactPhone: "98763549",
          rating: 5,
        },
      };

      await api.post("/api/products").send(invalidProduct).expect(400);
    });

    it("should not increase the number of products in the database", async () => {
      const invalidProduct = {
        category: "i10",
        description: "latest model 2026 white colour",
        price: 1000,
        stockQuantity: 30,
        supplier: {
          name: "hyundai",
          contactEmail: "hyundai@example.com",
          contactPhone: "98763549",
          rating: 5,
        },
      };

      await api.post("/api/products").send(invalidProduct).expect(400);

      const productsAtEnd = await Product.find({});
      expect(productsAtEnd).toHaveLength(initialProducts.length);
    });
  });
});

describe("GET /api/products/:productId", () => {
  describe("when the id is valid", () => {
    it("should return one product by ID", async () => {
      const product = await Product.findOne();

      const response = await api
        .get(`/api/products/${product._id}`)
        .expect(200);

      expect(response.body.title).toBe(product.title);
    });
  });

  describe("when the id does not exist", () => {
    it("should return status 404", async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      await api.get(`/api/products/${nonExistentId}`).expect(404);
    });
  });

  describe("when the id is invalid", () => {
    it("should return status 404", async () => {
      await api.get("/api/products/12345").expect(404);
    });
  });
});

describe("PUT /api/products/:productId", () => {
  describe("when the id is valid", () => {
    it("should return status 200", async () => {
      const product = await Product.findOne();

      await api
        .put(`/api/products/${product._id}`)
        .send({ description: "Updated description", stockQuantity: 42 })
        .expect(200);
    });

    it("should persist the updated fields in the database", async () => {
      const product = await Product.findOne();
      const updates = {
        description: "Updated description",
        stockQuantity: 42,
      };

      await api.put(`/api/products/${product._id}`).send(updates).expect(200);

      const updatedProduct = await Product.findById(product._id);
      expect(updatedProduct.description).toBe(updates.description);
      expect(updatedProduct.stockQuantity).toBe(updates.stockQuantity);
    });
  });

  describe("when the id is invalid", () => {
    it("should return status 404", async () => {
      await api.put("/api/products/12345").send({}).expect(404);
    });
  });
});

describe("DELETE /api/products/:productId", () => {
  describe("when the id is valid", () => {
    it("should return status 204", async () => {
      const product = await Product.findOne();

      await api.delete(`/api/products/${product._id}`).expect(204);
    });

    it("should remove the product from the database", async () => {
      const product = await Product.findOne();

      await api.delete(`/api/products/${product._id}`).expect(204);

      const deletedProduct = await Product.findById(product._id);
      expect(deletedProduct).toBeNull();
    });
  });

  describe("when the id is invalid", () => {
    it("should return status 404", async () => {
      await api.delete("/api/products/12345").expect(404);
    });
  });
});
