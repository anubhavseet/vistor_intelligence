'use client'

import { useEffect, useState } from 'react'
import { useQuery, gql } from '@apollo/client'
import dynamic from 'next/dynamic'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const GET_LIVE_VISITOR_COUNT = gql`
  query GetLiveVisitorCount($siteId: String!) {
    getLiveVisitorCount(siteId: $siteId)
  }
`

// Dynamically import MapContainer to avoid SSR issues
const Map = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), {
  ssr: false,
})

const GET_VISITOR_MAP = gql`
  query GetVisitorMap($siteId: String!, $startDate: DateTime, $endDate: DateTime) {
    getVisitorMap(siteId: $siteId, startDate: $startDate, endDate: $endDate) {
      points {
        lat
        lng
        country
      }
      countryCounts {
        country
        count
      }
      totalVisitors
    }
  }
`

interface LiveVisitorMapProps {
  siteId: string
}

export default function LiveVisitorMap({ siteId }: LiveVisitorMapProps) {
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h')

  const { data: countData } = useQuery(GET_LIVE_VISITOR_COUNT, {
    variables: { siteId },
    pollInterval: 10000, // Update every 10 seconds
  })

  const getDateRange = () => {
    const now = new Date()
    const ranges = {
      '1h': new Date(now.getTime() - 60 * 60 * 1000),
      '24h': new Date(now.getTime() - 24 * 60 * 60 * 1000),
      '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    }
    return ranges[timeRange]
  }

  const { data, loading, error, refetch } = useQuery(GET_VISITOR_MAP, {
    variables: {
      siteId,
      startDate: getDateRange(),
    },
    pollInterval: 30000, // Refresh every 30 seconds
  })

  useEffect(() => {
    refetch()
  }, [timeRange, refetch])

  if (loading) return <div className="p-8">Loading map...</div>
  if (error) return <div className="p-8 text-red-500">Error: {error.message}</div>

  const points = data?.getVisitorMap?.points || []
  const countryCounts = data?.getVisitorMap?.countryCounts || []
  const totalVisitors = data?.getVisitorMap?.totalVisitors || 0

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Live Visitor Map</h2>
          <div className="flex space-x-2">
            {(['1h', '24h', '7d', '30d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg ${
                  timeRange === range
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4 flex justify-between items-center">
          <p className="text-gray-600">
            <span className="font-semibold">{totalVisitors}</span> visitors in the last {timeRange}
          </p>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold text-gray-900">
              {countData?.getLiveVisitorCount || 0} live now
            </span>
          </div>
        </div>

        <div className="h-[600px] w-full rounded-lg overflow-hidden">
          {typeof window !== 'undefined' && (
            <MapContainer
              center={[20, 0]}
              zoom={2}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {points.map((point: any, index: number) => (
                <CircleMarker
                  key={index}
                  center={[point.lat, point.lng]}
                  radius={5}
                  fillColor="#0ea5e9"
                  fillOpacity={0.6}
                  color="#0284c7"
                  weight={1}
                >
                  <Popup>{point.country}</Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Visitors by Country</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {countryCounts.map((country: any) => (
            <div key={country.country} className="p-3 bg-gray-50 rounded-lg">
              <p className="font-semibold text-gray-900">{country.country}</p>
              <p className="text-2xl font-bold text-primary-600">{country.count}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
