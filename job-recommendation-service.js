/**
 * Job Recommendation Service
 * This service provides functions for matching skills to job listings
 */

class JobRecommendationService {
    constructor() {
      // Sample job listings with required skills and descriptions
      this.jobListings = [
        {
          id: 1,
          title: "Frontend Developer",
          company: "TechCorp Inc.",
          location: "Calapan City, Oriental Mindoro",
          description:
            "We are looking for a skilled Frontend Developer proficient in React, JavaScript, and modern CSS frameworks.",
          requiredSkills: ["JavaScript", "React", "HTML", "CSS", "Bootstrap", "Git"],
          skillWeights: {
            JavaScript: 2,
            React: 3,
            HTML: 1,
            CSS: 1,
            Bootstrap: 1,
            Git: 1,
          },
          salary: "₱30,000 - ₱50,000 per month",
          employmentType: "Full-time",
          workSetup: "Hybrid",
        },
        {
          id: 2,
          title: "Backend Engineer",
          company: "DataSystems Ltd.",
          location: "Remote",
          description:
            "Join our team as a Backend Engineer with strong Python skills and experience with Django and PostgreSQL.",
          requiredSkills: ["Python", "Django", "PostgreSQL", "API", "Git", "AWS"],
          skillWeights: {
            Python: 3,
            Django: 3,
            PostgreSQL: 2,
            API: 1,
            Git: 1,
            AWS: 1,
          },
          salary: "₱40,000 - ₱60,000 per month",
          employmentType: "Full-time",
          workSetup: "Remote",
        },
        {
          id: 3,
          title: "Full Stack Developer",
          company: "Innovate Solutions",
          location: "Hybrid - Calapan City",
          description:
            "Seeking a Full Stack Developer with experience in Node.js, React, and MongoDB to work on exciting projects.",
          requiredSkills: ["JavaScript", "Node.js", "React", "MongoDB", "HTML", "CSS"],
          skillWeights: {
            JavaScript: 2,
            "Node.js": 2,
            React: 2,
            MongoDB: 2,
            HTML: 1,
            CSS: 1,
          },
          salary: "₱45,000 - ₱65,000 per month",
          employmentType: "Full-time",
          workSetup: "Hybrid",
        },
        {
          id: 4,
          title: "Mobile App Developer",
          company: "AppWorks",
          location: "Calapan City, Oriental Mindoro",
          description:
            "Looking for a Mobile App Developer with experience in React Native or Flutter to join our growing team.",
          requiredSkills: ["React Native", "JavaScript", "Mobile Development", "Git", "API"],
          skillWeights: {
            "React Native": 3,
            JavaScript: 2,
            "Mobile Development": 2,
            Git: 1,
            API: 1,
          },
          salary: "₱35,000 - ₱55,000 per month",
          employmentType: "Full-time",
          workSetup: "On-site",
        },
        {
          id: 5,
          title: "UI/UX Designer",
          company: "Creative Minds",
          location: "Remote",
          description:
            "We need a talented UI/UX Designer with skills in Figma, Adobe XD, and a good understanding of user experience principles.",
          requiredSkills: ["UI/UX", "Figma", "Adobe XD", "Sketch", "HTML", "CSS"],
          skillWeights: {
            "UI/UX": 3,
            Figma: 2,
            "Adobe XD": 2,
            Sketch: 1,
            HTML: 1,
            CSS: 1,
          },
          salary: "₱30,000 - ₱50,000 per month",
          employmentType: "Full-time",
          workSetup: "Remote",
        },
        {
          id: 6,
          title: "Data Scientist",
          company: "Analytics Pro",
          location: "Hybrid - Calapan City",
          description:
            "Join our data team as a Data Scientist with strong skills in Python, Machine Learning, and data visualization.",
          requiredSkills: ["Python", "Machine Learning", "Data Science", "SQL", "Statistics"],
          skillWeights: {
            Python: 2,
            "Machine Learning": 3,
            "Data Science": 3,
            SQL: 1,
            Statistics: 2,
          },
          salary: "₱50,000 - ₱80,000 per month",
          employmentType: "Full-time",
          workSetup: "Hybrid",
        },
        {
          id: 7,
          title: "DevOps Engineer",
          company: "Cloud Systems",
          location: "Remote",
          description:
            "We're hiring a DevOps Engineer experienced with AWS, Docker, and CI/CD pipelines to improve our infrastructure.",
          requiredSkills: ["AWS", "Docker", "Kubernetes", "Jenkins", "Git", "Linux"],
          skillWeights: {
            AWS: 3,
            Docker: 3,
            Kubernetes: 2,
            Jenkins: 2,
            Git: 1,
            Linux: 2,
          },
          salary: "₱45,000 - ₱70,000 per month",
          employmentType: "Full-time",
          workSetup: "Remote",
        },
        {
          id: 8,
          title: "Junior Web Developer",
          company: "WebTech Solutions",
          location: "Calapan City, Oriental Mindoro",
          description:
            "Entry-level position for a Web Developer with basic knowledge of HTML, CSS, and JavaScript. Great opportunity to learn and grow.",
          requiredSkills: ["HTML", "CSS", "JavaScript", "Responsive Design"],
          skillWeights: {
            HTML: 2,
            CSS: 2,
            JavaScript: 2,
            "Responsive Design": 1,
          },
          salary: "₱20,000 - ₱30,000 per month",
          employmentType: "Full-time",
          workSetup: "On-site",
        },
        {
          id: 9,
          title: "Python Developer",
          company: "Software Innovations",
          location: "Remote",
          description:
            "Looking for a Python Developer with experience in Flask or Django to work on backend services and APIs.",
          requiredSkills: ["Python", "Flask", "Django", "API", "Git"],
          skillWeights: {
            Python: 3,
            Flask: 2,
            Django: 2,
            API: 2,
            Git: 1,
          },
          salary: "₱35,000 - ₱55,000 per month",
          employmentType: "Full-time",
          workSetup: "Remote",
        },
        {
          id: 10,
          title: "QA Engineer",
          company: "Quality Tech",
          location: "Hybrid - Calapan City",
          description: "Join our QA team to ensure software quality through manual and automated testing procedures.",
          requiredSkills: ["Selenium", "Testing", "Python", "JavaScript", "QA Methodologies"],
          skillWeights: {
            Selenium: 2,
            Testing: 3,
            Python: 1,
            JavaScript: 1,
            "QA Methodologies": 2,
          },
          salary: "₱30,000 - ₱45,000 per month",
          employmentType: "Full-time",
          workSetup: "Hybrid",
        },
      ]
    }
  
    /**
     * Get all available job listings
     * @returns {object[]} Array of job listings
     */
    getAllJobs() {
      return this.jobListings
    }
  
    /**
     * Get job recommendations based on identified skills
     * @param {string[]} skills - Array of identified skills
     * @param {object} options - Optional filtering parameters
     * @returns {object[]} Array of job recommendations with match percentages
     */
    getRecommendations(skills, options = {}) {
      let filteredJobs = [...this.jobListings]
  
      // Apply filters if provided
      if (options.location) {
        filteredJobs = filteredJobs.filter((job) => job.location.toLowerCase().includes(options.location.toLowerCase()))
      }
  
      if (options.employmentType) {
        filteredJobs = filteredJobs.filter((job) => job.employmentType === options.employmentType)
      }
  
      if (options.workSetup) {
        filteredJobs = filteredJobs.filter((job) => job.workSetup === options.workSetup)
      }
  
      const recommendations = []
  
      filteredJobs.forEach((job) => {
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
  
        const matchPercentage = totalWeight > 0 ? (matchCount / totalWeight) * 100 : 0
  
        // Only include jobs with at least the minimum match percentage (default 30%)
        const minMatch = options.minMatchPercentage || 30
        if (matchPercentage >= minMatch) {
          recommendations.push({
            ...job,
            matchPercentage: Math.round(matchPercentage),
            matchedSkills: job.requiredSkills.filter((skill) => skills.includes(skill)),
            missingSkills: job.requiredSkills.filter((skill) => !skills.includes(skill)),
          })
        }
      })
  
      // Sort by match percentage (highest first)
      recommendations.sort((a, b) => b.matchPercentage - a.matchPercentage)
  
      // Apply limit if provided
      if (options.limit && options.limit > 0) {
        return recommendations.slice(0, options.limit)
      }
  
      return recommendations
    }
  
    /**
     * Get a specific job by ID
     * @param {number} jobId - The ID of the job to retrieve
     * @returns {object|null} The job object or null if not found
     */
    getJobById(jobId) {
      return this.jobListings.find((job) => job.id === jobId) || null
    }
  
    /**
     * Search jobs by keyword
     * @param {string} keyword - The keyword to search for
     * @returns {object[]} Array of matching jobs
     */
    searchJobs(keyword) {
      const lowerKeyword = keyword.toLowerCase()
      return this.jobListings.filter(
        (job) =>
          job.title.toLowerCase().includes(lowerKeyword) ||
          job.description.toLowerCase().includes(lowerKeyword) ||
          job.company.toLowerCase().includes(lowerKeyword) ||
          job.requiredSkills.some((skill) => skill.toLowerCase().includes(lowerKeyword)),
      )
    }
  }
  
  // Export the service
  if (typeof module !== "undefined" && module.exports) {
    module.exports = JobRecommendationService
  } else {
    // For browser use
    window.JobRecommendationService = JobRecommendationService
  }
  
  