/* eslint-disable no-param-reassign */
import {
  getRoutes,
  getStopAndStations,
  getFavouriteRoutes,
  setRelayEnvironment,
} from './DTSearchUtils';
import {
  getPositions,
  getFavouriteLocations,
  getFavouriteRoutes as getStoredFavouriteRoutes,
  getOldSearches,
  getFavouriteStops,
  getLanguage,
} from './storeUtils';
import { startLocationWatch } from '../action/PositionActions';
import { saveSearch } from '../action/SearchActions';

export default function intializeSearchContext(
  context,
  searchContext,
  relayEnvironment,
) {
  setRelayEnvironment(relayEnvironment);
  // DT-3424: Set SearchContext for Autosuggest and searchUtils.
  searchContext.context = context;
  searchContext.getOldSearches = getOldSearches;
  searchContext.getFavouriteLocations = getFavouriteLocations;
  searchContext.getFavouriteStops = getFavouriteStops;
  searchContext.getLanguage = getLanguage;
  searchContext.getStoredFavouriteRoutes = getStoredFavouriteRoutes;
  searchContext.getPositions = getPositions;
  searchContext.getRoutes = getRoutes;
  searchContext.getStopAndStations = getStopAndStations;
  searchContext.getFavouriteRoutes = getFavouriteRoutes;
  searchContext.startLocationWatch = startLocationWatch;
  searchContext.saveSearch = saveSearch;
}