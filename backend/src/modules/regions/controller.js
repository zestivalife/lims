import { listRegionConfigs } from './regionConfig.js';

export async function listRegions(req, res) {
  res.json(listRegionConfigs());
}
