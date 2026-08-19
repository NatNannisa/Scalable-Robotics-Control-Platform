class SupplierAdapter {
  constructor({ supplierId, supplierName }) {
    if (new.target === SupplierAdapter) throw new TypeError("SupplierAdapter is an interface and cannot be instantiated directly.");
    this.supplierId = supplierId;
    this.supplierName = supplierName;
  }

  async authenticate() {
    return true;
  }

  async getBranches() {
    throw new Error("getBranches() must be implemented by a supplier adapter.");
  }

  async getRobots() {
    throw new Error("getRobots() must be implemented by a supplier adapter.");
  }

  async getRobotStatus(robotId) {
    const robots = await this.getRobots();
    return robots.find((robot) => robot.robot_id === robotId) || null;
  }

  async getRobotEvents(robotId) {
    return this.getEvents({ robotId });
  }

  async getEvents() {
    throw new Error("getEvents() must be implemented by a supplier adapter.");
  }

  async getAlerts() {
    throw new Error("getAlerts() must be implemented by a supplier adapter.");
  }

  async getTickets() {
    return [];
  }

  normalizeRobotStatus() {
    throw new Error("normalizeRobotStatus() must be implemented by a supplier adapter.");
  }

  normalizeEvent() {
    throw new Error("normalizeEvent() must be implemented by a supplier adapter.");
  }

  normalizeAlert() {
    throw new Error("normalizeAlert() must be implemented by a supplier adapter.");
  }

  async healthCheck() {
    throw new Error("healthCheck() must be implemented by a supplier adapter.");
  }
}

module.exports = SupplierAdapter;
