const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");

const app = express();
app.use(express.json());

//session
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
  })
);


const url =
  "mongodb+srv://Samreen:4524.smr@cluster0.0vamaay.mongodb.net/Blog?retryWrites=true&w=majority";

// Connect to MongoDB
mongoose
  .connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });
  
  // User Schema
const Users = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model("User", Users);


// Register route
app.post("/register", async (req, res) => {
  try {
    
    const { username, email, password } = req.body;

    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    // Create new user
    const NewUser = new User({
      username,
      email,
      password,
    });

    await NewUser.save();

    return res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Login route
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the password is correct
    if (password === user.password) {
      // Store the user ID in the session
      req.session.userId = user._id;
      
      

      return res.status(200).json({ message: "Login successful" });
    } else {
      return res.status(401).json({ message: "Invalid password" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});


// Update Profile route
app.put("/profile", async (req, res) => {
  try {
    // Get the authenticated user ID from the session
    const userId = req.session.userId;
    const { username, email } = req.body;

    // Check if the user is authenticated
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Find the user by userId
    const user = await User.findByIdAndUpdate(
      userId,
      { username, email },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    } else {
      return res
        .status(200)
        .json({ message: "Profile updated successfully", user });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});


//============================================================================================


// Define blog post schema
const Blog = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  comments: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
  date: { type: Date, default: Date.now },
});
const BlogPost = mongoose.model("BlogPost", Blog);

// Create a blog post
app.post("/blog-posts", async (req, res) => {
  try {
	const userId = req.session.userId; // Get the  user's ID from the session
	
	 //Check if the user is authenticated
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { title, body } = req.body;
   
    

    // Create a new blog post
    const newBlogPost = new BlogPost({
      title,
      body,
      author: userId,
    });

    await newBlogPost.save();

    return res.status(201).json({ message: "Blog post created successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

//Show all posts 
app.get("/api/posts", async (req, res) => {
try {
	const userId = req.session.userId; // Get the  user's ID from the session
	// Check if the user is authenticated
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
	const posts = await Post.find(
	{userId: userId}
	);
	
	res.json(posts);
	} catch (error) {
	console.error(error);
	res.status(500).json({ message: "Server error" });
	}
});

// Update a blog post
app.put("/blog-posts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, body } = req.body;
    const userId = req.session.userId; // Get the user's ID from the session
	// Check if the user is authenticated
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Find the blog post by ID and author
    const blogPost = await BlogPost.findOneAndUpdate(
      { _id: id, author: userId },
      { title, body },
      { new: true }
    );

    if (!blogPost) {
      return res
        .status(404)
        .json({ message: "Blog post not found or unauthorized" });
    }

    return res.status(200).json({ message: "Blog post updated successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});
