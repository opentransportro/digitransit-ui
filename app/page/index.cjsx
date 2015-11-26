React              = require 'react'
Relay              = require 'react-relay'
queries            = require '../queries'
IndexNavigation    = require '../component/navigation/index-navigation.cjsx'
Map                = require '../component/map/map.cjsx'
FrontPagePanel     = require '../component/front-page/front-page-panel.cjsx'
SearchTwoFieldsContainer = require '../component/search/search-two-fields-container'
Icon               = require '../component/icon/icon'
Link               = require 'react-router/lib/Link'
MapWithTracking    = require '../component/map/map-with-tracking'
OffcanvasMenu         = require '../component/navigation/offcanvas-menu'
LeftNav               = require 'material-ui/lib/left-nav'

class Page extends React.Component
  @contextTypes:
    getStore: React.PropTypes.func.isRequired
    executeAction: React.PropTypes.func.isRequired
    history: React.PropTypes.object.isRequired

  toggleFullscreenMap: =>
    @context.history.pushState null, "/kartta"

  render: ->
    <div className="fullscreen">
      <LeftNav style={zIndex:10, backgroundColor:'#000'} ref="leftNav" docked={false} open={true}>
        <OffcanvasMenu/>
      </LeftNav>

      <IndexNavigation className="front-page fullscreen">
        <MapWithTracking>
          <SearchTwoFieldsContainer/>
        </MapWithTracking>
        <FrontPagePanel/>
      </IndexNavigation>
    </div>
module.exports = Page
