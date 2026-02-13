import { gql } from "@apollo/client";

export const GET_PAGE_SECTIONS = gql`
  query GetPageSections($siteId: String!, $url: String!) {
    getPageSections(siteId: $siteId, url: $url) {
      selector
      html
      description
    }
  }
`;

export const GET_SECTION_METRICS = gql`
  query GetSectionMetrics($siteId: String!, $url: String!, $days: Int!) {
    getSectionMetrics(siteId: $siteId, url: $url, days: $days) {
      selector
      avgDwellTime
      clickCount
    }
  }
`;
