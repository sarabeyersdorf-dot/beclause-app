import React, { useState } from 'react';
import { Calendar, Home, FileText, MessageSquare, TrendingUp, Users, Bell, CheckSquare, AlertCircle, Search, Plus, Upload, Send, Bot, Clock, Award, DollarSign, ChevronRight, ChevronDown, Eye, Download, Settings, LogOut, Sparkles, Target, Shield, BookOpen } from 'lucide-react';

const brandColors = {
  navy: '#2A2947',
  teal: '#3BB4C1',
  magenta: '#E91E63',
  gold: '#FDB913',
  purple: '#6B5B95',
  lightBg: '#F5F7FA',
  white: '#FFFFFF'
};

const BeClausePlatform = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [showAICopilot, setShowAICopilot] = useState(true);
  const [activeTransaction, setActiveTransaction] = useState(null);
  const [userRole, setUserRole] = useState('agent');

  const transactions = [
    {
      id: 1,
      address: '1234 Oak Street, San Francisco, CA 94102',
      type: 'Buy-Side',
      status: 'Active',
      client: 'Sarah & John Martinez',
      closeDate: '2025-02-15',
      progress: 65,
      riskLevel: 'low',
      nextMilestone: 'Inspection Contingency Removal',
      daysUntil: 3,
      missingDocs: 2,
      complianceScore: 92
    },
    {
      id: 2,
      address: '5678 Pine Avenue, Oakland, CA 94610',
      type: 'Sell-Side',
      status: 'Pending',
      client: 'Michael
