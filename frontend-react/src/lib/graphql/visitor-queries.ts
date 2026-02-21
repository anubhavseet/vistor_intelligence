import { gql } from "@apollo/client";

export const GET_VISITORS = gql`
    query GetVisitors($siteId: String!, $limit: Int, $offset: Int, $sortBy: String, $sortOrder: String) {
        getVisitors(siteId: $siteId, limit: $limit, offset: $offset, sortBy: $sortBy, sortOrder: $sortOrder) {
            total
            visitors {
                visitorId
                firstSeenAt
                lastSeenAt
                totalSessions
                totalPageViews
                totalTimeSpent
                avgIntentScore
                tags
                deviceStats {
                    mobileCount
                    desktopCount
                    lastDevice
                }
                geo {
                    country
                    city
                    region
                }
            }
        }
    }
`;
