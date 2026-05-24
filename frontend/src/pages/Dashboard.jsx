import { useState, useEffect, useCallback } from 'react'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Spinner from '../components/ui/Spinner'
import { getCases, patchCase } from '../api/client'

const STATUS_BADGE_MAP = {
  pending: 'neutral',
  reviewed: 'success',
  escalated: 'danger',
}

const STATUS_LABELS = {
  pending: 'Pending',
  reviewed: 'Reviewed',
  escalated: 'Escalated',
}

export default function Dashboard() {
  const [cases, setCases] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState(null)

  const fetchCases = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getCases({ status: statusFilter })
      setCases(data)
    } catch (err) {
      setError('Failed to load cases. Is the backend running?')
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchCases()
  }, [fetchCases])

  const handleReview = useCallback(async (reportId) => {
    try {
      await patchCase(reportId, { status: 'reviewed', radiologistNote: 'Reviewed by radiologist' })
      fetchCases()
    } catch (err) {
      console.error('Failed to update case:', err)
    }
  }, [fetchCases])

  const handleEscalate = useCallback(async (reportId) => {
    try {
      await patchCase(reportId, { status: 'escalated', radiologistNote: 'Escalated for urgent review' })
      fetchCases()
    } catch (err) {
      console.error('Failed to escalate case:', err)
    }
  }, [fetchCases])

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-10 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-bricolagegrotesque font-semibold text-heading text-midnight-ink">
          Radiologist Queue
        </h1>

        {/* Status filter */}
        <div className="flex gap-2">
          {[null, 'pending', 'reviewed', 'escalated'].map((st) => (
            <button
              key={st ?? 'all'}
              onClick={() => setStatusFilter(st)}
              className={[
                'px-3 py-1 rounded-badges',
                'font-inter text-caption',
                'cursor-pointer transition-colors duration-150',
                statusFilter === st
                  ? 'bg-midnight-ink text-canvas-white'
                  : 'bg-pale-cloud text-ghost-gray hover:text-midnight-ink',
              ].join(' ')}
            >
              {st ? STATUS_LABELS[st] : 'All'}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <Card className="mb-4 !border-l-4 border-l-rose-bloom !p-4 border-mist-gray">
          <p className="font-inter text-body text-rose-bloom">{error}</p>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner size={40} />
        </div>
      ) : cases.length === 0 ? (
        <Card className="text-center py-10">
          <p className="font-inter text-ghost-gray text-body">
            No cases in queue. Cases appear here when X-ray analysis has high uncertainty.
          </p>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-pale-cloud">
                {['Case ID', 'Timestamp', 'Body Region', 'Uncertainty', 'NLP Severity', 'Fracture Prob', 'Status', 'Action'].map((col) => (
                  <th
                    key={col}
                    className={[
                      'text-left px-3 py-2',
                      'font-inter text-caption text-ghost-gray font-medium',
                    ].join(' ')}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => (
                <tr
                  key={c.report_id}
                  className="border-b border-mist-gray hover:bg-pale-cloud transition-colors duration-100"
                >
                  <td className="px-3 py-2 font-inter text-caption tabular-nums text-midnight-ink">
                    {c.report_id.slice(0, 8)}
                  </td>
                  <td className="px-3 py-2 font-inter text-caption text-midnight-ink">
                    {new Date(c.timestamp).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 font-inter text-caption text-midnight-ink">
                    {c.body_region}
                  </td>
                  <td className="px-3 py-2 font-inter text-caption text-midnight-ink">
                    {(c.uncertainty_score * 100).toFixed(1)}%
                  </td>
                  <td className="px-3 py-2">
                    <Badge variant={c.nlp_severity === 'high' ? 'danger' : 'neutral'}>
                      {c.nlp_severity}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 font-inter text-caption text-midnight-ink">
                    {(c.fracture_prob * 100).toFixed(1)}%
                  </td>
                  <td className="px-3 py-2">
                    <Badge variant={STATUS_BADGE_MAP[c.status]}>
                      {STATUS_LABELS[c.status]}
                    </Badge>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      {c.status === 'pending' && (
                        <>
                          <Button variant="secondary" onClick={() => handleReview(c.report_id)} className="!px-3 !py-1 !text-caption">
                            Review
                          </Button>
                          <button
                            onClick={() => handleEscalate(c.report_id)}
                            className="px-2 py-0.5 font-inter text-caption text-rose-bloom hover:underline cursor-pointer"
                          >
                            Escalate
                          </button>
                        </>
                      )}
                      {c.status !== 'pending' && (
                        <span className="font-inter text-caption text-mist-gray">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
