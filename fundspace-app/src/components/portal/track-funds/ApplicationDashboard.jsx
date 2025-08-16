// src/components/portal/track-funds/ApplicationDashboard.jsx
import { useState } from 'react';
import { Building2, AlertCircle, Eye, FileText } from '../../Icons.jsx';

// Import sub-components
import DashboardHeader from './components/DashboardHeader.jsx';
import ApplicationTimeline from './components/ApplicationTimeline.jsx';
import DocumentManager from './components/DocumentManager.jsx';
import TeamSection from './components/TeamSection.jsx';
import CommentsSection from './components/CommentsSection.jsx';
import ActionMenu from './components/ActionMenu.jsx';
import TeamModal from './components/TeamModal.jsx';

const ApplicationDashboard = ({ applications = [], onOpenDetailModal, onMarkAsReceived, onRemoveApplication }) => {
  const [showComments, setShowComments] = useState({});
  const [newComment, setNewComment] = useState({});
  const [showDocuments, setShowDocuments] = useState({});
  const [showTeamModal, setShowTeamModal] = useState(false);

  // Transform and enrich application data
  const transformedApplications = applications.map((app, index) => {
    const currentPhase = Math.min((index % 5) + 3, 7);
    return {
      id: app.id,
      title: app.title,
      organization: app.foundationName,
      amount: formatFundingAmount(app.fundingAmount),
      logoUrl: app.organization?.image_url,
      currentPhase: currentPhase,
      totalPhases: 7,
      status: getRealisticStatus(currentPhase),
      dueDate: app.dueDate || "Rolling",
      appliedDate: app.applied_date || "8/4/2025",
      expectedAwardDate: getExpectedAwardDate(index),
      fundingQuarter: getFundingQuarter(index),
      applicantCount: getApplicantCount(app.id),
      teamMembers: getTeamMembers(app, index),
      phases: generateRealisticPhases(currentPhase),
      nextAction: getRealisticNextAction(currentPhase),
      nextDeadline: getNextDeadline(currentPhase, index),
      unreadComments: Math.floor(Math.random() * 3),
      completionPercentage: Math.round((currentPhase / 7) * 100)
    };
  });

  // Helper functions
  function formatFundingAmount(amount) {
    if (!amount || amount === 'Not specified') return 'Amount not specified';
    if (typeof amount === 'string' && amount.includes('$')) return amount;
    
    const numAmount = typeof amount === 'string' ? parseInt(amount) : amount;
    if (numAmount >= 1000000) {
      return `${(numAmount / 1000000).toFixed(1)}M`;
    } else if (numAmount >= 1000) {
      return `${(numAmount / 1000).toFixed(0)}K`;
    }
    return `${numAmount?.toLocaleString() || 'Not specified'}`;
  }

  function getApplicantCount() {
    return Math.floor(Math.random() * 150) + 10;
  }

  function getRealisticStatus(currentPhase) {
    const statuses = {
      1: "Requirements Review",
      2: "Drafting Application", 
      3: "Recently Submitted",
      4: "Under Funder Review",
      5: "Awaiting Response",
      6: "Decision Pending",
      7: "Award Process"
    };
    return statuses[currentPhase] || "In Progress";
  }

  function getExpectedAwardDate(index) {
    const dates = ["Q4 2025", "Q1 2026", "Q2 2026", "Q3 2026"];
    return dates[index % dates.length];
  }

  function getFundingQuarter(index) {
    const quarters = ["Q4 2025", "Q1 2026", "Q2 2026"];
    return quarters[index % quarters.length];
  }

  function getTeamMembers(_, index) {
    const mockTeamMembers = [
      { id: 1, name: "Sarah Chen", avatar: null, initials: "SC", role: "Lead", isOnline: true },
      { id: 2, name: "Mike Johnson", avatar: null, initials: "MJ", role: "Writer", isOnline: false },
      { id: 3, name: "Alex Rivera", avatar: null, initials: "AR", role: "Reviewer", isOnline: true }
    ];
    return mockTeamMembers.slice(0, (index % 3) + 1);
  }

  function generateRealisticPhases(currentPhase) {
    const allPhases = [
      { id: 1, name: "Review Requirements", status: "completed", date: "7/28/2025", description: "Research requirements and prepare documentation" },
      { id: 2, name: "Draft Application", status: "completed", date: "8/1/2025", description: "Write application and gather supporting materials" },
      { id: 3, name: "Submit Application", status: "completed", date: "8/4/2025", description: "Final review and official submission" },
      { id: 4, name: "Funder Review", status: "pending", date: "TBD", description: "Application under review by grant committee" },
      { id: 5, name: "Response/Modifications", status: "pending", date: "TBD", description: "Address funder feedback and questions" },
      { id: 6, name: "Award Decision", status: "pending", date: "TBD", description: "Final award determination by board" },
      { id: 7, name: "Award Letter", status: "pending", date: "TBD", description: "Official award notification and compliance setup" }
    ];

    return allPhases.map((phase, index) => ({
      ...phase,
      status: index < currentPhase ? "completed" : index === currentPhase - 1 ? "current" : "pending"
    }));
  }

  function getRealisticNextAction(currentPhase) {
    const actions = {
      1: "Complete requirements checklist and gather documentation",
      2: "Finalize application draft and prepare supporting materials", 
      3: "Application submitted - waiting for acknowledgment from funder",
      4: "Under review by grant committee - no action required",
      5: "Prepare for potential funder questions or modification requests",
      6: "Awaiting final decision from board review",
      7: "Prepare for award acceptance and compliance requirements"
    };
    return actions[currentPhase] || "Monitor application status";
  }

  function getNextDeadline(currentPhase, index) {
    if (currentPhase <= 3) return null;
    
    const deadlines = [
      "Response deadline: 9/15/2025",
      "Board decision: 9/30/2025", 
      "Award notification: 10/15/2025",
      "Funding start: Q4 2025"
    ];
    return deadlines[index % deadlines.length];
  }

  // Event handlers
  const toggleComments = (appId) => {
    setShowComments(prev => ({ ...prev, [appId]: !prev[appId] }));
  };

  const handleCommentChange = (appId, value) => {
    setNewComment(prev => ({ ...prev, [appId]: value }));
  };

  const handleCommentSubmit = (appId) => {
    if (newComment[appId]?.trim()) {
      console.log('New comment:', newComment[appId]);
      setNewComment(prev => ({ ...prev, [appId]: '' }));
    }
  };

  const toggleDocuments = (appId, phaseId) => {
    const key = `${appId}-${phaseId}`;
    setShowDocuments(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const closeAllDocuments = () => {
    setShowDocuments({});
  };

  // Application Card Component
  const ApplicationCard = ({ application }) => (
    <div className="bg-white rounded-xl border border-slate-200 hover:shadow-lg transition-all duration-300 p-6 mb-6">
      {/* Header Section with Gradient */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6 border border-blue-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {application.logoUrl ? (
              <img 
                src={application.logoUrl} 
                alt="Organization logo"
                className="w-12 h-12 rounded-lg object-cover border-2 border-white shadow-sm"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center border-2 border-white shadow-sm">
                <Building2 size={20} className="text-white" />
              </div>
            )}
            <div>
              <h3 className="font-bold text-slate-900 text-lg">{application.title}</h3>
              <p className="text-slate-600">{application.organization}</p>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-sm text-slate-500">Status: {application.status}</span>
                <span className="text-sm text-slate-500">•</span>
                <span className="text-sm text-slate-500">{application.applicantCount} total applicants</span>
                <span className="text-sm text-slate-500">•</span>
                <span className="text-sm font-medium text-blue-600">{application.completionPercentage}% complete</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-1">
              {application.amount}
            </div>
            <div className="text-sm text-slate-600">Expected: {application.expectedAwardDate}</div>
            <div className="text-xs text-slate-500">Funding: {application.fundingQuarter}</div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <ApplicationTimeline 
        phases={application.phases}
        currentPhase={application.currentPhase}
        totalPhases={application.totalPhases}
        nextDeadline={application.nextDeadline}
        onToggleDocuments={(phaseId) => toggleDocuments(application.id, phaseId)}
      />

      {/* Document Management */}
      <DocumentManager 
        phases={application.phases}
        applicationId={application.id}
        showDocuments={showDocuments}
        onClose={closeAllDocuments}
      />

      {/* Next Action Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-blue-900 mb-1">Next Action Required</p>
            <p className="text-sm text-blue-700">{application.nextAction}</p>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <TeamSection 
        teamMembers={application.teamMembers}
        unreadComments={application.unreadComments}
        onToggleComments={() => toggleComments(application.id)}
        onAddMember={() => setShowTeamModal(true)}
      />

      {/* Comments Section */}
      <CommentsSection 
        applicationId={application.id}
        isVisible={showComments[application.id]}
        onClose={() => toggleComments(application.id)}
        newComment={newComment[application.id]}
        onCommentChange={(value) => handleCommentChange(application.id, value)}
        onCommentSubmit={() => handleCommentSubmit(application.id)}
      />

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button 
          onClick={() => onOpenDetailModal(application)}
          className="flex-1 bg-gradient-to-r from-slate-100 to-blue-100 text-slate-700 px-4 py-3 rounded-lg text-sm font-medium hover:from-slate-200 hover:to-blue-200 transition-all flex items-center justify-center gap-2 border border-slate-300 shadow-sm"
        >
          <Eye size={16} />
          View Full Details
        </button>
        <ActionMenu 
          application={application}
          onMarkAsReceived={onMarkAsReceived}
          onRemoveApplication={onRemoveApplication}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <DashboardHeader applications={transformedApplications} />

      {/* Applications List */}
      {transformedApplications.length > 0 ? (
        <div className="space-y-6">
          {transformedApplications.map((application) => (
            <ApplicationCard key={application.id} application={application} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="bg-gradient-to-r from-slate-50 to-blue-50 p-12 rounded-3xl border border-slate-200 shadow-xl max-w-md mx-auto">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <FileText size={40} className="text-white" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-3">No applications yet</h3>
            <p className="text-slate-600">Start applying to grants to see your comprehensive application dashboard with team collaboration features.</p>
          </div>
        </div>
      )}

      {/* Team Modal */}
      <TeamModal 
        isVisible={showTeamModal}
        onClose={() => setShowTeamModal(false)}
      />
    </div>
  );
};

export default ApplicationDashboard;