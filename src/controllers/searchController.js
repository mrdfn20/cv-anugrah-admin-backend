// controllers/searchController.js
import SearchService from '../services/searchService.js';

const search = async (req, res) => {
  const { q } = req.query;

  if (!q || q.trim() === '') {
    return res.status(400).json({ error: 'Query parameter `q` is required.' });
  }

  try {
    const results = await SearchService.globalSearch(q);

    return res.status(200).json({
      message: 'Search results fetched successfully',
      data: results,
    });
  } catch (error) {
    console.error('Search error:', error.message);
    return res.status(500).json({ error: error.message });
  }
};

export default { search };
