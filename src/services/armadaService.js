import ArmadaModel from '../models/armadaModel.js';

const ArmadaService = {
  async getAll() {
    return await ArmadaModel.getAll();
  },

  async getById(id) {
    return await ArmadaModel.getById(id);
  },

  async create(armada_name) {
    const insertId = await ArmadaModel.create(armada_name);
    return { id: insertId, armada_name };
  },

  async update(id, armada_name) {
    const existing = await ArmadaModel.getById(id);
    if (!existing) {
      throw new Error('Armada not found');
    }
    await ArmadaModel.update(id, armada_name);
    return { id, armada_name };
  },

  async delete(id) {
    const existing = await ArmadaModel.getById(id);
    if (!existing) {
      throw new Error('Armada not found');
    }

    const usageCount = await ArmadaModel.countTransactionsUsingArmada(id);
    if (usageCount > 0) {
      throw new Error(
        `Armada masih dipakai di ${usageCount} transaksi, tidak bisa dihapus`
      );
    }

    await ArmadaModel.delete(id);
    return { message: 'Armada deleted successfully' };
  },
};

export default ArmadaService;
