const mediaRepository = require('../Repositories/MediaRepository');

class MediaService {
  async getMedia(query = {}) {
    const { category, type, media_type, search, station, expedition, limit = 100, page = 1 } = query;
    const filter = {};

    if (category && category !== 'all' && category.trim()) {
      filter.category = { $regex: `^${category.trim()}$`, $options: 'i' };
    }

    const targetType = media_type || type;
    if (targetType && targetType !== 'all' && targetType.trim()) {
      const typeVal = targetType.trim();
      filter.$or = [
        { media_type: { $regex: typeVal, $options: 'i' } },
        { type: { $regex: typeVal, $options: 'i' } }
      ];
    }
    if (station && station.trim()) {
      filter.location = { $regex: station.trim(), $options: 'i' };
    }
    if (expedition && expedition.trim()) {
      filter.expedition_id = expedition.trim();
    }
    if (search && search.trim()) {
      const searchTerm = search.trim();
      const regex = { $regex: searchTerm, $options: 'i' };
      filter.$or = [
        { title: regex },
        { description: regex },
        { location: regex },
        { tags: { $in: [new RegExp(searchTerm, 'i')] } }
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const parsedLimit = parseInt(limit, 10);

    const [media, total, categories] = await Promise.all([
      mediaRepository.find(filter, { skip, limit: parsedLimit, sort: { type: 1, title: 1 } }),
      mediaRepository.count(filter),
      mediaRepository.distinct('category')
    ]);

    return {
      media,
      total,
      page: parseInt(page, 10),
      limit: parsedLimit,
      available_categories: (categories || []).sort()
    };
  }

  async getMediaById(id) {
    const item = await mediaRepository.findBySlugOrId(id);
    if (!item) {
      throw { statusCode: 404, message: `Media item not found for id: ${id}` };
    }
    return item;
  }

  async searchMedia(q) {
    return mediaRepository.search(q);
  }

  async createMedia(data, userId) {
    if (!data.title || !data.type) {
      throw { statusCode: 400, message: 'Media title and type (image/video) are required.' };
    }
    const autoId = `media-${Date.now().toString().slice(-6)}`;
    return mediaRepository.insertOne({
      id: data.id || autoId,
      title: data.title,
      description: data.description || '',
      type: data.type.toLowerCase(),
      category: data.category || 'General Media',
      location: data.location || 'Polar Region',
      url: data.url || '',
      thumbnail_url: data.thumbnail_url || data.url || '',
      tags: data.tags || [],
      copyright: data.copyright || 'National Centre for Polar and Ocean Research (NCPOR)',
      created_by: userId
    });
  }
}

module.exports = new MediaService();
