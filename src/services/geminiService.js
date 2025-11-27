const { getModel } = require('../config/gemini');
const conversationRepository = require('../repositories/conversationRepository');
const { UrgencyLevel, ComplexityRating } = require('../models/enums');
const { ExternalServiceError } = require('../utils/errors');
const logger = require('../utils/logger');

class GeminiService {
  async analyzeConversation(conversation, recentMessages) {
    try {
      // Check if we have cached analysis
      const cached = await this.getCachedAnalysis(conversation);
      if (cached) {
        logger.debug('Using cached AI analysis', { conversationId: conversation.id });
        return cached;
      }

      // Build prompt for Gemini
      const prompt = this._buildPrompt(conversation, recentMessages);

      // Call Gemini AI
      const model = getModel();
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse response
      const analysis = this.parseAIResponse(text);

      // Cache the analysis
      await this.cacheAnalysis(conversation.id, analysis);

      logger.info('AI analysis completed', { 
        conversationId: conversation.id,
        urgency: analysis.urgency_level,
        sentiment: analysis.sentiment_score,
        complexity: analysis.complexity_rating
      });

      return analysis;
    } catch (error) {
      logger.error('Gemini AI analysis failed', { 
        conversationId: conversation.id,
        error: error.message 
      });
      throw new ExternalServiceError('Gemini AI', error.message);
    }
  }

  async getCachedAnalysis(conversation) {
    // Check if analysis exists and is not stale
    if (conversation.analyzed_at && conversation.urgency_level) {
      const analyzedAt = new Date(conversation.analyzed_at);
      const lastMessageAt = new Date(conversation.last_message_at);

      // Cache is valid if analysis was done after last message
      if (analyzedAt >= lastMessageAt) {
        return {
          urgency_level: conversation.urgency_level,
          sentiment_score: parseFloat(conversation.sentiment_score),
          complexity_rating: conversation.complexity_rating
        };
      }
    }

    return null;
  }

  async cacheAnalysis(conversationId, analysis) {
    await conversationRepository.update(conversationId, {
      urgencyLevel: analysis.urgency_level,
      sentimentScore: analysis.sentiment_score,
      complexityRating: analysis.complexity_rating,
      analyzedAt: new Date()
    });
  }

  parseAIResponse(responseText) {
    try {
      // Try to extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          urgency_level: parsed.urgency_level || UrgencyLevel.MEDIUM,
          sentiment_score: parseFloat(parsed.sentiment_score) || 0,
          complexity_rating: parsed.complexity_rating || ComplexityRating.MEDIUM
        };
      }

      // Fallback parsing if JSON not found
      logger.warn('Could not parse JSON from Gemini response, using fallback');
      return this._fallbackParsing(responseText);
    } catch (error) {
      logger.error('Failed to parse AI response', { error: error.message });
      return this._fallbackParsing(responseText);
    }
  }

  _buildPrompt(conversation, recentMessages) {
    const messagesText = recentMessages && recentMessages.length > 0
      ? recentMessages.map(m => `[${m.timestamp}] ${m.sender}: ${m.text}`).join('\n')
      : 'No recent messages available';

    return `Analyze the following customer support conversation and provide:
1. Urgency level (LOW, MEDIUM, HIGH, CRITICAL)
2. Sentiment score (-1.0 to 1.0, where -1 is very negative and 1 is very positive)
3. Complexity rating (SIMPLE, MEDIUM, COMPLEX)

Conversation context:
- Customer phone: ${conversation.customer_phone_number}
- Message count: ${conversation.message_count}
- Last message time: ${conversation.last_message_at}

Recent messages:
${messagesText}

Respond in JSON format:
{
  "urgency_level": "HIGH|MEDIUM|LOW|CRITICAL",
  "sentiment_score": -0.5,
  "complexity_rating": "SIMPLE|MEDIUM|COMPLEX",
  "reasoning": "brief explanation"
}`;
  }

  _fallbackParsing(text) {
    const lowerText = text.toLowerCase();
    
    // Determine urgency
    let urgency_level = UrgencyLevel.MEDIUM;
    if (lowerText.includes('critical') || lowerText.includes('urgent')) {
      urgency_level = UrgencyLevel.CRITICAL;
    } else if (lowerText.includes('high')) {
      urgency_level = UrgencyLevel.HIGH;
    } else if (lowerText.includes('low')) {
      urgency_level = UrgencyLevel.LOW;
    }

    // Determine sentiment
    let sentiment_score = 0;
    if (lowerText.includes('negative') || lowerText.includes('angry') || lowerText.includes('frustrated')) {
      sentiment_score = -0.6;
    } else if (lowerText.includes('positive') || lowerText.includes('happy') || lowerText.includes('satisfied')) {
      sentiment_score = 0.6;
    }

    // Determine complexity
    let complexity_rating = ComplexityRating.MEDIUM;
    if (lowerText.includes('complex') || lowerText.includes('complicated')) {
      complexity_rating = ComplexityRating.COMPLEX;
    } else if (lowerText.includes('simple') || lowerText.includes('easy')) {
      complexity_rating = ComplexityRating.SIMPLE;
    }

    return { urgency_level, sentiment_score, complexity_rating };
  }

  calculateFallbackPriority(conversation) {
    // Time-based fallback: older conversations get higher priority
    const now = Date.now();
    const lastMessageTime = new Date(conversation.last_message_at).getTime();
    const ageInMinutes = (now - lastMessageTime) / (1000 * 60);
    
    // Priority increases with age, capped at 100
    return Math.min(ageInMinutes, 100);
  }
}

module.exports = new GeminiService();
