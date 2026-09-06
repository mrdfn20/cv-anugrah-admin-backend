import dbConnection from '../config/db.js';

const RegionModel = {
  async getAllRegions() {
    const query = `SELECT id, region_name, region_type FROM regions ORDER BY region_name`;
    const [results] = await dbConnection.promise().execute(query);
    return results;
  },

  async getRegionById(id) {
    const query = `SELECT id, region_name, region_type FROM regions WHERE id = ?`;
    const [results] = await dbConnection.promise().execute(query, [id]);
    return results[0] || null;
  },

  async createRegion(region_name, region_type) {
    const query = `INSERT INTO regions (region_name, region_type) VALUES (?, ?)`;
    const [result] = await dbConnection.promise().execute(query, [region_name, region_type]);
    return result.insertId;
  },

  async updateRegion(id, region_name, region_type) {
    const query = `UPDATE regions SET region_name = ?, region_type = ? WHERE id = ?`;
    const [result] = await dbConnection
      .promise()
      .execute(query, [region_name, region_type, id]);
    return result;
  },

  async deleteRegion(id) {
    const query = `DELETE FROM regions WHERE id = ?`;
    const [result] = await dbConnection.promise().execute(query, [id]);
    return result;
  },

  /**
   * Hitung berapa sub_region yang masih ada di bawah region ini - dipakai
   * sebagai guard sebelum hapus region, supaya sub_region gak jadi yatim.
   */
  async countSubRegionsUsingRegion(regionId) {
    const query = `SELECT COUNT(*) AS total FROM sub_regions WHERE region_id = ?`;
    const [results] = await dbConnection.promise().execute(query, [regionId]);
    return Number(results[0].total) || 0;
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

  async getSubRegionById(id) {
    const query = `SELECT id, sub_region_name, region_id FROM sub_regions WHERE id = ?`;
    const [results] = await dbConnection.promise().execute(query, [id]);
    return results[0] || null;
  },

  async createSubRegion(region_id, sub_region_name) {
    const query = `INSERT INTO sub_regions (region_id, sub_region_name) VALUES (?, ?)`;
    const [result] = await dbConnection
      .promise()
      .execute(query, [region_id, sub_region_name]);
    return result.insertId;
  },

  async updateSubRegion(id, region_id, sub_region_name) {
    const query = `UPDATE sub_regions SET region_id = ?, sub_region_name = ? WHERE id = ?`;
    const [result] = await dbConnection
      .promise()
      .execute(query, [region_id, sub_region_name, id]);
    return result;
  },

  async deleteSubRegion(id) {
    const query = `DELETE FROM sub_regions WHERE id = ?`;
    const [result] = await dbConnection.promise().execute(query, [id]);
    return result;
  },

  /**
   * Hitung berapa pelanggan yang masih pakai sub_region ini - dipakai sebagai
   * guard sebelum hapus sub_region, supaya data pelanggan gak jadi yatim.
   */
  async countCustomersUsingSubRegion(subRegionId) {
    const query = `SELECT COUNT(*) AS total FROM customers WHERE sub_region_id = ? AND deleted_at IS NULL`;
    const [results] = await dbConnection.promise().execute(query, [subRegionId]);
    return Number(results[0].total) || 0;
  },
};

export default RegionModel;
