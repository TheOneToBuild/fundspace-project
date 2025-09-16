// src/components/discover/data/demographics/index.js
import { bayAreaOverview } from './bayAreaOverview.js';
import { alamedaCounty } from './alamedaCounty.js';
import { contraCostaCounty } from './contraCostaCounty.js';
import { marinCounty } from './marinCounty.js';
import { napaCounty } from './napaCounty.js';
import { sanFranciscoCounty } from './sanFranciscoCounty.js';
import { sanMateoCounty } from './sanMateoCounty.js';
import { santaClaraCounty } from './santaClaraCounty.js';
import { solanoCounty } from './solanoCounty.js';
import { sonomaCounty } from './sonomaCounty.js';

export const DEMOGRAPHICS_DATA = {
    ...bayAreaOverview,
    ...alamedaCounty,
    ...contraCostaCounty,
    ...marinCounty,
    ...napaCounty,
    ...sanFranciscoCounty,
    ...sanMateoCounty,
    ...santaClaraCounty,
    ...solanoCounty,
    ...sonomaCounty
};