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

    const blogs = Array.from({ length: 10 }).map((_, index) => ({
      _id: `b${index + 1}`,
      title: `Mastering Node.js Backend – Part ${index + 1}`,
      slug: `mastering-nodejs-backend-part-${index + 1}`,
      excerpt:
        'Learn how to build scalable and production-ready Node.js applications with best practices, clean architecture, and real-world examples.',
      createdAt: new Date(Date.now() - index * 86400000),
      likesCount: Math.floor(Math.random() * 500),
      commentsCount: Math.floor(Math.random() * 120),
      views: Math.floor(Math.random() * 2000),
      tags: ['nodejs', 'backend', 'express'],
      author: {
        _id: 'a1',
        username: 'DevShala',
        avatar: 'https://i.pravatar.cc/150?img=32',
      },
    }));

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
}

export default new FrontendController();
