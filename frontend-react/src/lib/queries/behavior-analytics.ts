import { gql } from "@apollo/client";

export const GET_BEHAVIOR_ANALYTICS = gql`
    query GetBehaviorAnalytics($siteId: String!, $days: Float!) {
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
    }
`;
