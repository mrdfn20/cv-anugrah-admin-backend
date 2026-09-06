import dbConnection from '../config/db.js';

const RegionModel = {
  async getAllRegions() {
    const query = `SELECT id, region_name, region_type FROM regions ORDER BY region_name`;
    const [results] = await dbConnection.promise().execute(query);
    return results;
  },

  async getAllSubRegions() {
    const query = `
      SELECT sr.id, sr.sub_region_name, sr.region_id, r.region_name, r.region_type
      FROM sub_regions sr
      LEFT JOIN regions r ON sr.region_id = r.id
      ORDER BY r.region_name, sr.sub_region_name
    `;
    const [results] = await dbConnection.promise().execute(query);
    return results;
  },
};

export default RegionModel;
