import Logger from '@config/logger.js';
import { Request, Response } from 'express';

class FrontendController {
  renderHomePage = async (req: Request, res: Response) => {
    const user = {
      _id: 'u123',
      username: 'susovan',
      avatar: 'https://i.pravatar.cc/150?img=12',
      role: 'USER',
    };

    const filters = {
      search: req.query.search || '',
      category: req.query.category || '',
      tag: req.query.tag || '',
    };
    const categories = [
      { name: 'JavaScript', count: 12 },
      { name: 'Node.js', count: 9 },
      { name: 'MongoDB', count: 7 },
      { name: 'System Design', count: 5 },
      { name: 'DevOps', count: 4 },
    ];

    const tags = [
      'javascript',
      'nodejs',
      'mongodb',
      'express',
      'backend',
      'docker',
      'microservices',
    ];

    const blogs = [
      {
        _id: '66a1f001aa11111111111111',
        title: 'Understanding Node.js Event Loop in Depth',
        slug: 'understanding-nodejs-event-loop-in-depth',
        content:
          'The Node.js event loop is what allows Node.js to perform non-blocking I/O operations...',
        excerpt: 'Learn how the Node.js event loop works internally with real-world examples.',
        authorId: '66a1a001bb22222222222222',
        publisherId: '66a1b001cc33333333333333',
        categories: ['66c1c001dd44444444444444'],
        tags: ['nodejs', 'event-loop', 'backend', 'javascript'],
        coverImage: 'https://cdn.devshala.com/blogs/node-event-loop.png',
        status: {
          approval: 'APPROVED',
          isPublished: true,
        },
        approval: {
          adminApproved: true,
          publisherApproved: true,
          adminApprovedAt: new Date('2025-01-10T10:30:00Z'),
          publisherApprovedAt: new Date('2025-01-09T18:00:00Z'),
        },
        stats: {
          views: 1240,
          likes: 120,
          comments: 18,
        },
        publishedAt: new Date('2025-01-11T06:00:00Z'),
        createdAt: new Date('2025-01-08T12:00:00Z'),
        updatedAt: new Date('2025-01-11T06:00:00Z'),
      },

      {
        _id: '66a1f002aa11111111111111',
        title: 'JWT Authentication: Best Practices for Backend Developers',
        slug: 'jwt-authentication-best-practices',
        content:
          'JWT is widely used for authentication, but incorrect usage can lead to security flaws...',
        excerpt: 'Avoid common JWT mistakes and secure your backend like a pro.',
        authorId: '66a1a002bb22222222222222',
        publisherId: '66a1b001cc33333333333333',
        categories: ['66c1c002dd44444444444444'],
        tags: ['jwt', 'authentication', 'security', 'backend'],
        coverImage: 'https://cdn.devshala.com/blogs/jwt-auth.png',
        status: {
          approval: 'APPROVED',
          isPublished: true,
        },
        approval: {
          adminApproved: true,
          publisherApproved: true,
          adminApprovedAt: new Date('2025-01-15T09:00:00Z'),
          publisherApprovedAt: new Date('2025-01-14T20:00:00Z'),
        },
        stats: {
          views: 980,
          likes: 96,
          comments: 12,
        },
        publishedAt: new Date('2025-01-16T05:30:00Z'),
        createdAt: new Date('2025-01-13T11:00:00Z'),
        updatedAt: new Date('2025-01-16T05:30:00Z'),
      },

      {
        _id: '66a1f003aa11111111111111',
        title: 'MongoDB Indexing Explained with Examples',
        slug: 'mongodb-indexing-explained',
        content: 'Indexes improve query performance but misuse can slow down writes...',
        excerpt: 'Master MongoDB indexing strategies for scalable applications.',
        authorId: '66a1a003bb22222222222222',
        publisherId: '66a1b002cc33333333333333',
        categories: ['66c1c003dd44444444444444'],
        tags: ['mongodb', 'database', 'indexing'],
        coverImage: 'https://cdn.devshala.com/blogs/mongodb-index.png',
        status: {
          approval: 'PENDING',
          isPublished: false,
        },
        approval: {
          adminApproved: false,
          publisherApproved: true,
          publisherApprovedAt: new Date('2025-01-18T14:00:00Z'),
        },
        stats: {
          views: 0,
          likes: 0,
          comments: 0,
        },
        createdAt: new Date('2025-01-17T10:30:00Z'),
        updatedAt: new Date('2025-01-18T14:00:00Z'),
      },

      {
        _id: '66a1f004aa11111111111111',
        title: 'REST vs GraphQL: Which One Should You Choose?',
        slug: 'rest-vs-graphql',
        content: 'Both REST and GraphQL have their own strengths and weaknesses...',
        excerpt: 'A practical comparison of REST and GraphQL for real-world APIs.',
        authorId: '66a1a004bb22222222222222',
        publisherId: '66a1b002cc33333333333333',
        categories: ['66c1c004dd44444444444444'],
        tags: ['api', 'graphql', 'rest'],
        coverImage: 'https://cdn.devshala.com/blogs/rest-vs-graphql.png',
        status: {
          approval: 'REJECTED',
          isPublished: false,
        },
        approval: {
          adminApproved: false,
          publisherApproved: true,
          rejectedBy: 'ADMIN',
          rejectionReason: 'Content lacks real-world examples',
          publisherApprovedAt: new Date('2025-01-12T16:00:00Z'),
        },
        stats: {
          views: 0,
          likes: 0,
          comments: 0,
        },
        createdAt: new Date('2025-01-11T09:00:00Z'),
        updatedAt: new Date('2025-01-12T16:30:00Z'),
      },

      {
        _id: '66a1f005aa11111111111111',
        title: 'Scaling Node.js Applications with Microservices',
        slug: 'scaling-nodejs-with-microservices',
        content: 'Microservices help teams scale applications independently...',
        excerpt: 'Learn how to scale Node.js apps using microservices architecture.',
        authorId: '66a1a005bb22222222222222',
        publisherId: '66a1b003cc33333333333333',
        categories: ['66c1c005dd44444444444444'],
        tags: ['microservices', 'nodejs', 'scaling'],
        coverImage: 'https://cdn.devshala.com/blogs/microservices-node.png',
        status: {
          approval: 'APPROVED',
          isPublished: true,
        },
        approval: {
          adminApproved: true,
          publisherApproved: true,
          adminApprovedAt: new Date('2025-01-05T08:00:00Z'),
          publisherApprovedAt: new Date('2025-01-04T19:00:00Z'),
        },
        stats: {
          views: 2100,
          likes: 240,
          comments: 42,
        },
        publishedAt: new Date('2025-01-06T06:00:00Z'),
        createdAt: new Date('2025-01-03T12:00:00Z'),
        updatedAt: new Date('2025-01-06T06:00:00Z'),
      },
    ];

    // ================= PAGINATION =================
    const pagination = {
      currentPage: Number(req.query.page) || 1,
      totalPages: 5,
      totalBlogs: 50,
      limit: 10,
    };

    // ================= RENDER =================
    res.render('index', {
      user, // comment this line to test logged-out UI
      filters,
      categories,
      tags,
      blogs,
      pagination,
    });
  };

  async renderBlogDetailsPage(req: Request, res: Response) {
    try {
      Logger.info('Getting blog details page...');

      const blog = {
        _id: '66a1f001aa11111111111111',

        title: 'Understanding Node.js Event Loop in Depth',
        slug: 'understanding-nodejs-event-loop-in-depth',

        content: `
    <p>The <strong>Node.js Event Loop</strong> is what allows Node.js to perform
    non-blocking I/O operations despite JavaScript being single-threaded.</p>

    <h2>How the Event Loop Works</h2>
    <p>Node.js uses libuv under the hood to handle asynchronous operations.</p>

    <pre><code>setTimeout(() => {
      console.log("Hello from event loop");
    }, 0);</code></pre>

    <p>This makes Node.js highly efficient for I/O-heavy applications.</p>
  `,

        excerpt: 'Learn how the Node.js event loop works internally with real-world examples.',

        coverImage: 'https://cdn.devshala.com/blogs/node-event-loop.png',

        tags: ['nodejs', 'event-loop', 'backend', 'javascript'],

        status: {
          approval: 'APPROVED',
          isPublished: true,
        },

        approval: {
          adminApproved: true,
          publisherApproved: true,
          adminApprovedAt: new Date('2025-01-10T10:30:00Z'),
          publisherApprovedAt: new Date('2025-01-09T18:00:00Z'),
        },

        stats: {
          views: 1240,
          likes: 120,
          comments: 3,
        },

        publishedAt: new Date('2025-01-11T06:00:00Z'),
        createdAt: new Date('2025-01-08T12:00:00Z'),
        updatedAt: new Date('2025-01-11T06:00:00Z'),

        author: {
          _id: '66a1a001bb22222222222222',
          username: 'dev_susovan',
          avatar: '/images/authors/susovan.png',
        },
      };

      const user = {
        _id: '77b1u001cc99999999999999',
        username: 'john_doe',
        email: 'john@example.com',
        avatar: '/images/users/john.png',
        role: 'USER',
      };

      const comments = [
        {
          _id: '88c001',
          content: 'This explanation of the event loop is super clear 🔥',
          createdAt: new Date('2025-01-12T09:30:00Z'),
          user: {
            _id: 'u001',
            username: 'rahul_dev',
            avatar: '/images/users/rahul.png',
          },
        },
        {
          _id: '88c002',
          content: 'Finally understood microtasks vs macrotasks. Thanks!',
          createdAt: new Date('2025-01-12T11:15:00Z'),
          user: {
            _id: 'u002',
            username: 'ananya_codes',
            avatar: '/images/users/ananya.png',
          },
        },
        {
          _id: '88c003',
          content: 'Can you write a follow-up on worker threads?',
          createdAt: new Date('2025-01-13T08:00:00Z'),
          user: {
            _id: 'u003',
            username: 'backend_guy',
            avatar: '/images/users/backend.png',
          },
        },
      ];

      const relatedBlogs = [
        {
          _id: 'rel001',
          title: 'Promises vs Async/Await Explained',
          slug: 'promises-vs-async-await',
        },
        {
          _id: 'rel002',
          title: 'Scaling Node.js Applications with Microservices',
          slug: 'scaling-nodejs-with-microservices',
        },
        {
          _id: 'rel003',
          title: 'MongoDB Indexing Best Practices',
          slug: 'mongodb-indexing-best-practices',
        },
      ];
      const isLiked = true; // user already liked this blog
      const isBookmarked = false; // user has NOT bookmarked yet

      return res.render('blog-details', {
        title: 'Blog | Details',
        pageTitle: 'Blog Details',
        blog,
        user,
        comments,
        relatedBlogs,
        isLiked,
        isBookmarked,
      });
    } catch (error) {
      Logger.warn((error as Error).message);

      req.flash('error', (error as Error).message);
      return res.redirect('/');
    }
  }
}

export default new FrontendController();
