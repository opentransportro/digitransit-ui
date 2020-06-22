import moment from 'moment';
import cx from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import Link from 'found/lib/Link';

import ComponentUsageExample from './ComponentUsageExample';
import Icon from './Icon';
import ItineraryCircleLineWithIcon from './ItineraryCircleLineWithIcon';
import PlatformNumber from './PlatformNumber';
import ServiceAlertIcon from './ServiceAlertIcon';
import { getActiveAlertSeverityLevel } from '../util/alertUtils';
import { PREFIX_STOPS } from '../util/path';
import {
  CityBikeNetworkType,
  getCityBikeNetworkId,
  getCityBikeNetworkConfig,
} from '../util/citybikes';
import { displayDistance } from '../util/geo-utils';
import { durationToString } from '../util/timeUtils';
import { isKeyboardSelectionEvent } from '../util/browser';

function WalkLeg(
  { children, focusAction, setMapZoomToLeg, index, leg, previousLeg },
  { config },
) {
  const distance = displayDistance(parseInt(leg.distance, 10), config);
  const duration = durationToString(leg.duration * 1000);
  const modeClassName = 'walk';
  const isFirstLeg = i => i === 0;
  const [address, place] = leg.from.name.split(/, (.+)/);

  const networkType = getCityBikeNetworkConfig(
    getCityBikeNetworkId(
      previousLeg &&
        previousLeg.rentedBike &&
        previousLeg.from.bikeRentalStation &&
        previousLeg.from.bikeRentalStation.networks,
    ),
    config,
  ).type;

  const returnNotice =
    previousLeg && previousLeg.rentedBike ? (
      <FormattedMessage
        id={
          networkType === CityBikeNetworkType.Scooter
            ? 'return-scooter-to'
            : 'return-cycle-to'
        }
        values={{ station: leg.from ? leg.from.name : '' }}
        defaultMessage="Return the bike to {station} station"
      />
    ) : null;

  return (
    <div key={index} className="row itinerary-row">
      <span className="sr-only">
        {returnNotice}
        <FormattedMessage
          id="itinerary-details.walk-leg"
          values={{
            time: moment(leg.startTime).format('HH:mm'),
            distance,
            duration,
            origin: leg.from ? leg.from.name : '',
            destination: leg.to ? leg.to.name : '',
          }}
        />
      </span>
      <div className="small-2 columns itinerary-time-column" aria-hidden="true">
        <div className="itinerary-time-column-time">
          {moment(leg.startTime).format('HH:mm')}
        </div>
      </div>
      <ItineraryCircleLineWithIcon
        index={index}
        modeClassName={modeClassName}
      />
      <div
        className={`small-9 columns itinerary-instruction-column ${leg.mode.toLowerCase()}`}
      >
        <span className="sr-only">
          <FormattedMessage
            id="itinerary-summary.show-on-map"
            values={{ target: leg.from.name || '' }}
          />
        </span>
        {isFirstLeg(index) ? (
          <div
            className={cx('itinerary-leg-first-row', 'walk', 'first')}
            aria-hidden="true"
          >
            <div className="address-container">
              <div className="address">
                {address}
                {leg.from.stop && (
                  <Icon
                    img="icon-icon_arrow-collapse--right"
                    className="itinerary-arrow-icon"
                    color="#333"
                  />
                )}
              </div>
              <div className="place">{place}</div>
            </div>
            <div
              className="itinerary-map-action"
              onClick={focusAction}
              onKeyPress={e => isKeyboardSelectionEvent(e) && focusAction(e)}
              role="button"
              tabIndex="0"
            >
              <Icon
                img="icon-icon_show-on-map"
                className="itinerary-search-icon"
              />
            </div>
          </div>
        ) : (
          <div className="itinerary-leg-first-row" aria-hidden="true">
            <div className="itinerary-leg-row">
              {leg.from.stop ? (
                <Link
                  onClick={e => {
                    e.stopPropagation();
                  }}
                  onKeyPress={e => {
                    if (isKeyboardSelectionEvent(e)) {
                      e.stopPropagation();
                    }
                  }}
                  to={`/${PREFIX_STOPS}/${leg.from.stop.gtfsId}`}
                >
                  {returnNotice || leg.from.name}
                  <Icon
                    img="icon-icon_arrow-collapse--right"
                    className="itinerary-arrow-icon"
                    color="#333"
                  />
                  <ServiceAlertIcon
                    className="inline-icon"
                    severityLevel={getActiveAlertSeverityLevel(
                      leg.from.stop && leg.from.stop.alerts,
                      leg.startTime / 1000,
                    )}
                  />
                </Link>
              ) : (
                <>
                  {returnNotice || leg.from.name}
                  <Icon
                    img="icon-icon_arrow-collapse--right"
                    className="itinerary-arrow-icon"
                    color="#333"
                  />
                  <ServiceAlertIcon
                    className="inline-icon"
                    severityLevel={getActiveAlertSeverityLevel(
                      leg.from.stop && leg.from.stop.alerts,
                      leg.startTime / 1000,
                    )}
                  />
                </>
              )}
              <div className="stop-code-container">
                {children}
                {leg.from.stop && (
                  <PlatformNumber
                    number={leg.from.stop.platformCode}
                    short
                    isRailOrSubway={
                      modeClassName === 'rail' || modeClassName === 'subway'
                    }
                  />
                )}
              </div>
            </div>
            <div
              className="itinerary-map-action"
              onClick={focusAction}
              onKeyPress={e => isKeyboardSelectionEvent(e) && focusAction(e)}
              role="button"
              tabIndex="0"
            >
              <Icon
                img="icon-icon_show-on-map"
                className="itinerary-search-icon"
              />
            </div>
          </div>
        )}

        <div className="itinerary-leg-action" aria-hidden="true">
          <div className="itinerary-leg-action-content">
            <FormattedMessage
              id="walk-distance-duration"
              values={{ distance, duration }}
              defaultMessage="Walk {distance} ({duration})"
            />

            <div
              className="itinerary-map-action"
              onClick={setMapZoomToLeg}
              onKeyPress={e =>
                isKeyboardSelectionEvent(e) && setMapZoomToLeg(e)
              }
              role="button"
              tabIndex="0"
            >
              <Icon
                img="icon-icon_show-on-map"
                className="itinerary-search-icon"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const exampleLeg = t1 => ({
  duration: 438,
  startTime: t1 + 10000,
  distance: 483.84600000000006,
  mode: 'WALK',
  from: { name: 'Messukeskus', stop: { code: '0613' } },
});

WalkLeg.description = () => {
  const today = moment()
    .hour(12)
    .minute(34)
    .second(0)
    .valueOf();
  return (
    <div>
      <p>Displays an itinerary walk leg.</p>
      <ComponentUsageExample description="walk-start">
        <WalkLeg leg={exampleLeg(today)} index={0} focusAction={() => {}} />
      </ComponentUsageExample>
      <ComponentUsageExample description="walk-middle">
        <WalkLeg leg={exampleLeg(today)} index={1} focusAction={() => {}} />
      </ComponentUsageExample>
    </div>
  );
};

const walkLegShape = PropTypes.shape({
  distance: PropTypes.number.isRequired,
  duration: PropTypes.number.isRequired,
  from: PropTypes.shape({
    name: PropTypes.string.isRequired,
    stop: PropTypes.shape({
      code: PropTypes.string,
    }),
  }).isRequired,
  mode: PropTypes.string.isRequired,
  rentedBike: PropTypes.bool,
  startTime: PropTypes.number.isRequired,
});

WalkLeg.propTypes = {
  children: PropTypes.node,
  focusAction: PropTypes.func.isRequired,
  index: PropTypes.number.isRequired,
  leg: walkLegShape.isRequired,
  previousLeg: walkLegShape,
  setMapZoomToLeg: PropTypes.func.isRequired,
};

WalkLeg.defaultProps = {
  previousLeg: undefined,
};

WalkLeg.contextTypes = { config: PropTypes.object.isRequired };

export default WalkLeg;
