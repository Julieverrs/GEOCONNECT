/**
 * Resume NLP Service
 * This service provides functions for analyzing resumes and extracting skills
 */

class ResumeNLPService {
    constructor() {
      // Initialize with a predefined list of skills to look for
      this.skillsList = [
        // Programming Languages
        "JavaScript",
        "Python",
        "Java",
        "C#",
        "C++",
        "Ruby",
        "PHP",
        "Swift",
        "Kotlin",
        "Go",
        "TypeScript",
        "Rust",
        "Scala",
        "Perl",
        "R",
        "MATLAB",
        "Dart",
        "Objective-C",
        "Lua",
  
        // Web Development
        "React",
        "Angular",
        "Vue",
        "Node.js",
        "Express",
        "Django",
        "Flask",
        "Spring",
        "ASP.NET",
        "HTML",
        "CSS",
        "SASS",
        "LESS",
        "Bootstrap",
        "Tailwind CSS",
        "Material UI",
        "jQuery",
        "Redux",
        "GraphQL",
        "REST API",
        "SOAP",
        "WebSockets",
        "PWA",
        "SPA",
        "SSR",
        "JAMstack",
  
        // Databases
        "SQL",
        "MySQL",
        "PostgreSQL",
        "MongoDB",
        "Firebase",
        "Oracle",
        "SQLite",
        "Redis",
        "DynamoDB",
        "Cassandra",
        "MariaDB",
        "Neo4j",
        "Elasticsearch",
        "Couchbase",
  
        // DevOps & Cloud
        "AWS",
        "Azure",
        "Google Cloud",
        "Docker",
        "Kubernetes",
        "Jenkins",
        "Git",
        "GitHub",
        "GitLab",
        "Bitbucket",
        "CI/CD",
        "Terraform",
        "Ansible",
        "Puppet",
        "Chef",
        "Nginx",
        "Apache",
        "Linux",
        "Windows Server",
        "Bash",
        "PowerShell",
  
        // Data Science & AI
        "Machine Learning",
        "Deep Learning",
        "Data Science",
        "AI",
        "NLP",
        "Computer Vision",
        "TensorFlow",
        "PyTorch",
        "Keras",
        "Scikit-learn",
        "Pandas",
        "NumPy",
        "SciPy",
        "Data Mining",
        "Data Analysis",
        "Big Data",
        "Hadoop",
        "Spark",
        "Data Visualization",
        "Tableau",
        "Power BI",
        "D3.js",
        "Statistics",
        "Probability",
  
        // Mobile Development
        "React Native",
        "Flutter",
        "Xamarin",
        "iOS",
        "Android",
        "Mobile Development",
        "Swift UI",
        "Kotlin Multiplatform",
        "Ionic",
        "Cordova",
        "PhoneGap",
  
        // Design
        "UI/UX",
        "Figma",
        "Adobe XD",
        "Sketch",
        "Photoshop",
        "Illustrator",
        "InDesign",
        "Wireframing",
        "Prototyping",
        "User Research",
        "Usability Testing",
  
        // Soft Skills
        "Agile",
        "Scrum",
        "Kanban",
        "Project Management",
        "Team Leadership",
        "Communication",
        "Problem Solving",
        "Critical Thinking",
        "Teamwork",
        "Time Management",
        "Creativity",
        "Adaptability",
        "Attention to Detail",
        "Analytical Skills",
  
        // Industry-specific
        "Fintech",
        "Healthtech",
        "Edtech",
        "E-commerce",
        "Blockchain",
        "Cryptocurrency",
        "IoT",
        "Cybersecurity",
        "Network Security",
        "Penetration Testing",
        "Ethical Hacking",
        "SEO",
        "Digital Marketing",
        "Content Management",
        "CRM",
        "ERP",
        "Supply Chain",
      ]
  
      // Common skill variations and abbreviations
      this.skillVariations = {
        JavaScript: ["JS", "ECMAScript"],
        Python: ["Py", "Python3"],
        Java: ["J2EE", "JavaEE", "Jakarta EE"],
        "C#": ["CSharp", "C Sharp"],
        "C++": ["CPP", "C Plus Plus"],
        React: ["ReactJS", "React.js"],
        Angular: ["AngularJS", "Angular2+"],
        Vue: ["VueJS", "Vue.js"],
        "Node.js": ["NodeJS", "Node"],
        "Machine Learning": ["ML"],
        "Deep Learning": ["DL"],
        "Artificial Intelligence": ["AI"],
        "Natural Language Processing": ["NLP"],
        "Amazon Web Services": ["AWS"],
        "Microsoft Azure": ["Azure"],
        "User Interface": ["UI"],
        "User Experience": ["UX"],
        "UI/UX": ["User Interface/User Experience"],
        "Search Engine Optimization": ["SEO"],
      }
    }
  
    /**
     * Analyze resume text to extract skills
     * @param {string} text - The text content of the resume
     * @returns {object} Analysis results including identified skills
     */
    analyzeResume(text) {
      // Preprocess the text
      const processedText = this.preprocessText(text)
  
      // Extract skills
      const skills = this.extractSkills(processedText)
  
      // Extract education (simplified)
      const education = this.extractEducation(text)
  
      // Extract experience (simplified)
      const experience = this.extractExperience(text)
  
      return {
        skills,
        education,
        experience,
        rawText: text,
      }
    }
  
    /**
     * Preprocess text for better analysis
     * @param {string} text - Raw text from resume
     * @returns {string} Processed text
     */
    preprocessText(text) {
      // Convert to lowercase for case-insensitive matching
      let processed = text.toLowerCase()
  
      // Replace multiple spaces and newlines with a single space
      processed = processed.replace(/\s+/g, " ")
  
      return processed
    }
  
    /**
     * Extract skills from processed text
     * @param {string} processedText - Preprocessed text
     * @returns {string[]} Array of identified skills
     */
    extractSkills(processedText) {
      const identifiedSkills = new Set()
  
      // Check for skills in the predefined list
      this.skillsList.forEach((skill) => {
        const skillLower = skill.toLowerCase()
        if (processedText.includes(skillLower)) {
          identifiedSkills.add(skill)
        }
  
        // Check for variations of the skill
        const variations = this.skillVariations[skill] || []
        variations.forEach((variation) => {
          if (processedText.includes(variation.toLowerCase())) {
            identifiedSkills.add(skill)
          }
        })
      })
  
      // Look for patterns that might indicate skills
      // For example, looking for bullet points followed by technical terms
      const bulletPointPattern = /[•\-*]\s*([^•\-*\n]+)/g
      let match
      while ((match = bulletPointPattern.exec(processedText)) !== null) {
        const bulletContent = match[1].trim().toLowerCase()
  
        // Check if any skill is mentioned in this bullet point
        this.skillsList.forEach((skill) => {
          const skillLower = skill.toLowerCase()
          if (bulletContent.includes(skillLower)) {
            identifiedSkills.add(skill)
          }
        })
      }
  
      return Array.from(identifiedSkills)
    }
  
    /**
     * Simple extraction of education information
     * @param {string} text - Resume text
     * @returns {string[]} Array of education entries
     */
    extractEducation(text) {
      const educationKeywords = ["education", "university", "college", "bachelor", "master", "phd", "degree", "diploma"]
      const educationSection = this.extractSection(text, educationKeywords)
  
      // Simple extraction of education entries
      const educationEntries = []
      if (educationSection) {
        const lines = educationSection.split("\n")
        for (const line of lines) {
          if (line.trim()) {
            educationEntries.push(line.trim())
          }
        }
      }
  
      return educationEntries
    }
  
    /**
     * Simple extraction of experience information
     * @param {string} text - Resume text
     * @returns {string[]} Array of experience entries
     */
    extractExperience(text) {
      const experienceKeywords = ["experience", "work", "employment", "job", "career", "position"]
      const experienceSection = this.extractSection(text, experienceKeywords)
  
      // Simple extraction of experience entries
      const experienceEntries = []
      if (experienceSection) {
        const lines = experienceSection.split("\n")
        for (const line of lines) {
          if (line.trim()) {
            experienceEntries.push(line.trim())
          }
        }
      }
  
      return experienceEntries
    }
  
    /**
     * Extract a section from the resume text based on keywords
     * @param {string} text - Resume text
     * @param {string[]} keywords - Keywords that might indicate the section
     * @returns {string|null} The extracted section or null if not found
     */
    extractSection(text, keywords) {
      // Convert text to lowercase for case-insensitive matching
      const lowerText = text.toLowerCase()
  
      // Find the start of the section
      let sectionStart = -1
      for (const keyword of keywords) {
        const keywordIndex = lowerText.indexOf(keyword)
        if (keywordIndex !== -1) {
          // Check if the keyword is likely a section header
          const lineStart = lowerText.lastIndexOf("\n", keywordIndex) + 1
          const lineEnd = lowerText.indexOf("\n", keywordIndex)
          const line = text.substring(lineStart, lineEnd !== -1 ? lineEnd : text.length)
  
          // If the keyword is prominent in the line (e.g., at the start, all caps, etc.)
          if (line.toLowerCase().indexOf(keyword) === 0 || line.toUpperCase() === line) {
            sectionStart = lineEnd !== -1 ? lineEnd + 1 : text.length
            break
          }
        }
      }
  
      if (sectionStart === -1) {
        return null
      }
  
      // Find the end of the section (next section or end of text)
      let sectionEnd = text.length
      const nextSectionMatch = text.substring(sectionStart).match(/\n\s*[A-Z][A-Z\s]+\s*\n/)
      if (nextSectionMatch) {
        sectionEnd = sectionStart + nextSectionMatch.index
      }
  
      return text.substring(sectionStart, sectionEnd).trim()
    }
  
    /**
     * Get job recommendations based on identified skills
     * @param {string[]} skills - Array of identified skills
     * @param {object[]} jobListings - Array of job listings to match against
     * @returns {object[]} Array of job recommendations with match percentages
     */
    getJobRecommendations(skills, jobListings) {
      const recommendations = []
  
      jobListings.forEach((job) => {
        // Calculate match percentage
        let matchCount = 0
        let totalWeight = 0
  
        job.requiredSkills.forEach((requiredSkill) => {
          const weight = job.skillWeights?.[requiredSkill] || 1
          totalWeight += weight
  
          if (skills.includes(requiredSkill)) {
            matchCount += weight
          }
        })
  
        const matchPercentage = (matchCount / totalWeight) * 100
  
        // Only include jobs with at least 30% match
        if (matchPercentage >= 30) {
          recommendations.push({
            ...job,
            matchPercentage: Math.round(matchPercentage),
            matchedSkills: job.requiredSkills.filter((skill) => skills.includes(skill)),
          })
        }
      })
  
      // Sort by match percentage (highest first)
      recommendations.sort((a, b) => b.matchPercentage - a.matchPercentage)
  
      return recommendations
    }
  }
  
  // Export the service
  if (typeof module !== "undefined" && module.exports) {
    module.exports = ResumeNLPService
  } else {
    // For browser use
    window.ResumeNLPService = ResumeNLPService
  }
  
  