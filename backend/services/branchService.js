const unified = require("./unifiedDataService");
const { HttpError } = require("../auth/authorize");

async function getBranches(accessContext) {
  const result = await unified.collect("getBranches", accessContext);
  return { branches: unified.mergeBranches(result.rows), meta: unified.responseMeta(accessContext, result.errors) };
}

async function getBranch(accessContext, branchId) {
  const [branchResult, robotResult] = await Promise.all([
    unified.collect("getBranches", accessContext),
    unified.collect("getRobots", accessContext)
  ]);
  const branch = unified.mergeBranches(branchResult.rows).find((item) => item.branch_id === branchId);
  if (!branch) throw new HttpError(404, "not_found", "Branch was not found in the current supplier scope.");
  const robots = robotResult.rows.filter((robot) => robot.branch_id === branchId);
  const errors = [...branchResult.errors, ...robotResult.errors];
  return {
    branch: {
      ...branch,
      robot_summary: {
        total: robots.length,
        online: robots.filter((robot) => ["ONLINE", "DELAYED", "DEGRADED"].includes(robot.connection_status)).length,
        alerts: robots.filter((robot) => ["BLOCKED", "LOW_BATTERY", "OFFLINE"].includes(robot.status)).length
      }
    },
    meta: unified.responseMeta(accessContext, errors)
  };
}

async function getBranchRobots(accessContext, branchId) {
  const branches = await getBranches(accessContext);
  if (!branches.branches.some((branch) => branch.branch_id === branchId)) {
    throw new HttpError(404, "not_found", "Branch was not found in the current supplier scope.");
  }
  const result = await unified.collect("getRobots", accessContext);
  return {
    robots: result.rows.filter((robot) => robot.branch_id === branchId),
    meta: unified.responseMeta(accessContext, [...branches.meta.adapter_errors, ...result.errors])
  };
}

module.exports = { getBranches, getBranch, getBranchRobots };
