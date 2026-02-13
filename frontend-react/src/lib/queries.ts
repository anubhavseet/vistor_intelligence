import { gql } from "@apollo/client";

export const GET_ANALYTICS = gql`
    query GetAnalytics($siteId: String!, $days: Float!) {
        getAnalyticsDashboard(siteId: $siteId, days: $days) {
            overview {
                totalSessions
                totalPageViews
                avgSessionDuration
                bounceRate
            }
            dailyStats {
                date
                sessions
                pageViews
            }
            referrers {
                source
                count
            }
            geoStats {
                country
                count
            }
            heatMapPoints {
                lat
                lng
                weight
            }
            topPages {
                url
                views
                visitors
            }
            pagePerformance {
                url
                avgScrollDepth
                avgTimeOnPage
                rageClicks
            }
            userFlows {
                source
                target
                count
            }
            behavioralPatterns {
                pattern
                count
                sessionIds
            }
        }
        getSite(siteId: $siteId) {
            id
            name
            domain
        }
    }
`;
