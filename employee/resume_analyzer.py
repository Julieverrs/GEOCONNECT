import re
import os
import nltk
import logging
from PyPDF2 import PdfReader
from docx import Document
from collections import Counter
from django.conf import settings
from difflib import SequenceMatcher
from collections import defaultdict

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Download necessary NLTK data - UPDATED WITH PROPER ERROR HANDLING
def download_nltk_resources():
    """Download required NLTK resources with proper error handling"""
    resources = ['punkt', 'stopwords']
    for resource in resources:
        try:
            nltk.data.find(f'tokenizers/{resource}')
            logger.info(f"NLTK resource '{resource}' is already downloaded.")
        except LookupError:
            try:
                logger.info(f"Downloading NLTK resource '{resource}'...")
                nltk.download(resource, quiet=True)
                logger.info(f"Successfully downloaded NLTK resource '{resource}'.")
            except Exception as e:
                logger.error(f"Failed to download NLTK resource '{resource}': {e}")
                # Create a fallback for tokenization if download fails
                if resource == 'punkt':
                    logger.warning("Using simple tokenization as fallback.")

# Call the download function at module import time
download_nltk_resources()

class ResumeAnalyzer:
    def __init__(self):
        # Try to get stopwords, but provide a fallback if not available
        try:
            self.stopwords = set(nltk.corpus.stopwords.words('english'))
        except LookupError:
            logger.warning("Stopwords not available. Using a minimal stopword list as fallback.")
            # Minimal set of English stopwords as fallback
            self.stopwords = set(['i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 
                                 'you', 'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 
                                 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 
                                 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 
                                 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 
                                 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 
                                 'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the', 
                                 'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of', 
                                 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 
                                 'through', 'during', 'before', 'after', 'above', 'below', 'to', 
                                 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 
                                 'again', 'further', 'then', 'once', 'here', 'there', 'when', 
                                 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 
                                 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 
                                 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 
                                 'just', 'don', 'should', 'now'])
        
        # Define skill categories
        self.skill_categories = {
    'programming_languages': [
        'python', 'java', 'javascript', 'c++', 'c#', 'ruby', 'php', 'swift', 'kotlin',
        'typescript', 'go', 'rust', 'scala', 'perl', 'r', 'matlab', 'dart', 'sql',
        'bash', 'powershell', 'objective-c', 'assembly', 'shell scripting', 'groovy'
    ],
    
    'web_development': [
        'html', 'css', 'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask',
        'laravel', 'asp.net', 'spring', 'bootstrap', 'jquery', 'sass', 'less', 'webpack',
        'gatsby', 'next.js', 'nuxt.js', 'svelte', 'ember', 'api development', 'restful api',
        'graphql', 'web security', 'progressive web apps', 'single page application'
    ],

    'databases': [
        'sql', 'mysql', 'postgresql', 'mongodb', 'sqlite', 'oracle', 'redis', 'cassandra',
        'dynamodb', 'firebase', 'mariadb', 'neo4j', 'couchdb', 'elasticsearch',
        'database management', 'nosql', 'relational databases', 'query optimization'
    ],

    'devops': [
        'docker', 'kubernetes', 'jenkins', 'aws', 'azure', 'gcp', 'terraform', 'ansible',
        'ci/cd', 'git', 'github', 'gitlab', 'bitbucket', 'linux', 'unix', 'bash', 'shell',
        'jenkins', 'circleci', 'travis ci', 'infrastructure as code', 'cloud deployment',
        'containerization', 'monitoring tools', 'logging', 'helm', 'argo cd', 'prometheus', 'grafana'
    ],

    'data_science': [
        'machine learning', 'deep learning', 'ai', 'artificial intelligence', 'data analysis',
        'pandas', 'numpy', 'scipy', 'scikit-learn', 'tensorflow', 'pytorch', 'keras',
        'tableau', 'power bi', 'data visualization', 'statistics', 'nlp', 'computer vision',
        'big data', 'spark', 'hadoop', 'data engineering', 'etl', 'predictive modeling',
        'data mining', 'a/b testing', 'data storytelling', 'clustering', 'regression'
    ],

    'mobile_development': [
        'android', 'ios', 'swift', 'kotlin', 'react native', 'flutter', 'xamarin',
        'objective-c', 'mobile app development', 'ionic', 'cordova', 'native script',
        'mobile ui/ux', 'cross-platform', 'mobile testing', 'firebase integration'
    ],

    'soft_skills': [
        'communication', 'teamwork', 'leadership', 'problem solving', 'critical thinking',
        'time management', 'adaptability', 'creativity', 'project management', 'agile',
        'scrum', 'kanban', 'presentation', 'negotiation', 'conflict resolution',
        'emotional intelligence', 'collaboration', 'interpersonal communication',
        'decision making', 'customer service', 'multitasking', 'attention to detail'
    ],

    'networking': [
        'networking', 'cisco', 'ccna', 'routing', 'switching', 'firewall', 'vpn',
        'tcp/ip', 'dns', 'dhcp', 'cybersecurity', 'network security', 'lan/wan',
        'sd-wan', 'wireless networking', 'vlan', 'wan optimization', 'network monitoring',
        'load balancing', 'network design', 'network automation', 'snmp', 'ospf', 'bgp'
    ],

    'it_support': [
        'it support', 'troubleshooting', 'hardware', 'software', 'windows', 'macos',
        'system administration', 'active directory', 'help desk', 'technical support',
        'remote support', 'ticketing system', 'desktop support', 'user training',
        'patch management', 'asset management', 'incident management', 'service desk',
        'end-user support', 'imac support', 'printers', 'antivirus', 'ms office troubleshooting'
    ],

    'cloud_computing': [
        'cloud computing', 'aws', 'azure', 'gcp', 'google cloud', 'cloud architecture',
        'serverless', 'iaas', 'paas', 'saas', 'cloud migration', 'cloud security',
        'multi-cloud', 'vmware', 'openstack', 'cloud storage', 'disaster recovery',
        'cost optimization', 'cloud automation', 'virtualization', 'containers', 'iac'
    ],

    'education_teaching': [
        'lesson planning', 'classroom management', 
        'student engagement', 'assessment evaluation',
        'inclusive education', 'modular teaching',
        'reading program', 'digital classroom',
        'google classroom', 'child protection',
        'online safety', 'student support', 'curriculum development',
        'educational technology', 'special needs', 'pedagogy', 'teaching methods',
        'e-learning', 'blended learning', 'distance learning', 'tutoring', 'mentoring'
    ],

    'project_management': [
        'task execution', 'planning', 'strategic planning',
        'resource allocation', 'budgeting', 'risk management',
        'stakeholder management', 'change management',
        'waterfall', 'scrum master', 'product owner', 'release planning',
        'agile coaching', 'kanban board', 'gantt charts', 'time tracking',
        'deliverables', 'milestones', 'project lifecycle', 'requirements gathering'
    ],

    'marketing': [
        'marketing', 'branding', 'social media marketing', 'market analysis',
        'digital marketing', 'advertising', 'seo', 'sem', 'content marketing',
        'email marketing', 'affiliate marketing', 'influencer marketing',
        'campaign management', 'lead generation', 'conversion rate optimization',
        'audience targeting', 'analytics', 'crm', 'brand awareness',
        'performance marketing', 'growth hacking', 'copywriting', 'utm parameters'
    ],

    'sales': [
        'sales', 'client relations', 'customer service', 'negotiation',
        'lead generation', 'closing deals', 'cold calling', 'sales strategy',
        'account management', 'inside sales', 'field sales', 'b2b sales',
        'b2c sales', 'sales forecasting', 'pipeline management', 'salesforce',
        'hubspot', 'upselling', 'cross-selling', 'deal negotiation', 'rfps'
    ],

    'finance': [
        'financial reporting', 'budgeting', 'accounting', 'bookkeeping',
        'tax preparation', 'financial planning', 'investment banking',
        'stock market', 'portfolio management', 'financial modeling',
        'risk assessment', 'audit', 'compliance', 'balance sheet',
        'income statement', 'cash flow', 'variance analysis', 'forecasting',
        'financial dashboards', 'erp systems', 'accounts receivable', 'accounts payable'
    ],

    'operations': [
        'operations management', 'logistics', 'vendor coordination', 'supply chain',
        'inventory management', 'procurement', 'warehouse operations', 'order fulfillment',
        'process improvement', 'quality control', 'six sigma', 'lean methodology',
        'business process', 'workflow management', 'business continuity', 'risk management',
        'resource planning', 'performance metrics', 'key performance indicators'
    ],

    'data_analysis': [
        'consumer behavior', 'survey design', 'research', 'data collection',
        'data cleaning', 'data preprocessing', 'statistical analysis', 'excel',
        'spss', 'stata', 'power query', 'power pivot', 'tableau dashboard',
        'data warehousing', 'data governance', 'dashboards', 'reporting',
        'data modeling', 'business analytics', 'predictive analytics', 'descriptive analytics'
    ],

    'design_ux_ui': [
        'ui design', 'ux design', 'figma', 'sketch', 'adobe xd', 'photoshop',
        'illustrator', 'after effects', 'prototyping', 'user research',
        'interaction design', 'information architecture', 'wireframing',
        'user flows', 'responsive design', 'graphic design', 'motion graphics',
        'branding design', 'product design', 'visual design', 'design systems'
    ],

    'qa_testing': [
        'manual testing', 'automation testing', 'selenium', 'testng', 'junit',
        'postman', 'soapui', 'cypress', 'playwright', 'test cases',
        'defect tracking', 'bug reporting', 'test plans', 'exploratory testing',
        'regression testing', 'integration testing', 'performance testing',
        'penetration testing', 'test automation frameworks', 'ci/cd pipelines',
        'test-driven development', 'acceptance criteria', 'test coverage'
    ],

    'game_development': [
        'unity', 'unreal engine', 'godot', 'game development',
        'game engines', '3d modeling', 'unity c#', 'game design',
        'game physics', 'animation', 'shader programming', 'level design',
        'game testing', 'game publishing', 'augmented reality', 'vr development'
    ],

    'cybersecurity': [
        'information security', 'ethical hacking', 'penetration testing',
        'network security', 'application security', 'threat modeling', 'siem',
        'ids/ips', 'endpoint security', 'zero trust', 'soc analyst', 'compliance',
        'pci dss', 'iso 27001', 'cryptography', 'access control',
        'vulnerability assessment', 'malware analysis', 'digital forensics'
    ],

    'blockchain': [
        'blockchain', 'ethereum', 'smart contracts', 'solidity',
        'decentralized applications', 'distributed ledger', 'crypto',
        'bitcoin', 'blockchain architecture', 'consensus mechanisms',
        'hyperledger', 'web3', 'tokenomics', 'blockchain security',
        'smart contract development', 'dapps', 'nft development',
        'blockchain consulting', 'blockchain integration'
    ],

    'robotics': [
        'robotics', 'robotic process automation', 'rpa', 'embedded systems',
        'microcontrollers', 'raspberry pi', 'arduino', 'sensor integration',
        'robotic arms', 'autonomous systems', 'robot navigation',
        'control systems', 'mechanical design', 'robotic vision',
        'path planning', 'kinematics', 'robot operating system',
        'ROS', 'motion control', 'robot simulation', 'SLAM', 'actuators'
    ],

    'iot': [
        'internet of things', 'iot', 'edge computing', 'device management',
        'sensor networks', 'mqtt', 'coap', 'loRa', 'zigbee', 'embedded development',
        'firmware', 'rtos', 'device drivers', 'hardware prototyping',
        'microcontroller programming', 'network protocols', 'cloud integration',
        'data streaming', 'real-time analytics', 'home automation',
        'industrial iot', 'smart devices', 'wearable tech'
    ],

    'human_resources': [
        'recruitment', 'onboarding', 'talent acquisition', 'employee relations',
        'compensation and benefits', 'hr analytics', 'performance management',
        'training and development', 'succession planning', 'workforce planning',
        'diversity and inclusion', 'payroll processing', 'leave management',
        'labor law compliance', 'job analysis', 'job description creation',
        'employee engagement', 'exit interviews', 'background checks'
    ],

    'healthcare': [
        'patient care', 'clinical operations', 'medical records', 'nursing',
        'health informatics', 'health data', 'ehr', 'electronic health records',
        'telemedicine', 'medical billing', 'insurance claims', 'health policy',
        'public health', 'patient satisfaction', 'healthcare management',
        'medical coding', 'diagnosis', 'treatment planning', 'emergency care',
        'pharmacology', 'case management', 'health education'
    ],

    'engineering': [
        'civil engineering', 'structural engineering', 'mechanical engineering',
        'electrical engineering', 'chemical engineering', 'automotive engineering',
        'aerospace engineering', 'biomedical engineering', 'environmental engineering',
        'project engineering', 'maintenance', 'materials science', 'manufacturing',
        'thermodynamics', 'fluid dynamics', 'mechatronics', 'cad', 'solidworks',
        'autocad', 'revit', 'ansys', 'catia', 'pro/e', 'creo', 'matlab', 'simulink'
    ],

    'customer_service': [
        'customer service', 'call center', 'help desk', 'live chat', 'email support',
        'ticketing system', 'first contact resolution', 'response time', 'csat',
        'net promoter score', 'feedback collection', 'escalation handling',
        'customer retention', 'customer outreach', 'phone support', 'support escalation',
        'knowledge base', 'customer onboarding', 'customer success', 'customer experience'
    ],

    'legal': [
        'legal research', 'contract drafting', 'litigation', 'compliance',
        'corporate law', 'intellectual property', 'ip rights', 'copyright',
        'trademark', 'patents', 'legal documentation', 'court procedures',
        'legal advising', 'regulatory compliance', 'contract review', 'due diligence',
        'legal risk', 'legal writing', 'document review', 'legal analysis'
    ],

    'design': [
        'graphic design', 'logo design', 'brand identity', 'packaging design',
        'illustration', 'photo editing', 'layout design', 'typography',
        'color theory', 'brand guidelines', 'adobe suite', 'canva', 'coreldraw',
        'adobe illustrator', 'adobe photoshop', 'adobe indesign', 'sketch',
        'figma', 'adobe xd', 'user interface design', 'user experience design',
        'creative direction', 'visual storytelling', 'brand assets', 'mockups'
    ],

    'entrepreneurship': [
        'startup', 'business plan', 'pitch deck', 'fundraising', 'venture capital',
        'angel investors', 'business development', 'product development',
        'market research', 'customer acquisition', 'revenue growth',
        'scaling', 'lean startup', 'go-to-market strategy', 'business model canvas',
        'profitability', 'market validation', 'business strategy', 'business operations',
        'founder', 'co-founder', 'investor relations', 'pitching', 'startup incubation'
    ],

    'arts_media': [
        'graphic design', 'photography', 'filmmaking', 'video editing', 'audio editing',
        'scriptwriting', 'storyboarding', 'animation', 'voice over', 'editing',
        'journalism', 'content writing', 'copywriting', 'technical writing',
        'social media content', 'content strategy', 'creative writing', 'film production',
        'media relations', 'press releases', 'media outreach', 'public speaking'
    ],

    'construction': [
        'project estimation', 'site supervision', 'contractor management',
        'construction planning', 'material procurement', 'quality assurance',
        'safety compliance', 'building codes', 'blueprint reading',
        'project scheduling', 'cost estimation', 'project delivery',
        'contract management', 'construction software', 'autocad', 'revit', 'ms project',
        'risk mitigation', 'site inspection', 'permits', 'licensing'
    ],

    'automotive': [
        'vehicle diagnostics', 'engine repair', 'auto body work', 'painting',
        'tire changing', 'brake maintenance', 'oil change', 'engine tuning',
        'car detailing', 'fleet management', 'automotive repair', 'vehicle inspection',
        'carpet cleaning', 'glass tinting', 'sound systems', 'custom car builds',
        'motorcycle repair', 'truck maintenance', 'automotive sales', 'parts replacement',
        'automotive customer service', 'service advisor', 'technician', 'mechanic'
    ],

    'retail_sales': [
        'point of sale', 'pos', 'merchandising', 'store layout', 'inventory management',
        'customer interaction', 'sales targets', 'customer loyalty', 'product knowledge',
        'sales pitch', 'checkout operations', 'cash handling', 'stock replenishment',
        'loss prevention', 'customer complaints', 'store management', 'retail operations',
        'customer engagement', 'product demonstration', 'up-selling', 'cross-selling'
    ],

    'hospitality': [
        'hotel management', 'guest services', 'front office', 'housekeeping',
        'food and beverage', 'restaurant management', 'event planning',
        'reservation systems', 'concierge', 'check-in check-out', 'tourism',
        'travel planning', 'customer satisfaction', 'service excellence',
        'reservation systems', 'event coordination', 'food safety',
        'guest relations', 'hotel booking', 'receptionist', 'bell services',
        'housekeeping management', 'front desk', 'concierge services'
    ],

    'freelancing': [
        'freelancing', 'remote work', 'freelance projects', 'client acquisition',
        'proposal writing', 'bid management', 'freelance platforms', 'upwork',
        'fiverr', 'toptal', 'freelancer.com', 'remote collaboration',
        'time tracking', 'invoice management', 'client communication', 'project delivery',
        'freelance portfolio', 'pricing strategies', 'contract negotiation'
    ],

    'data_engineering': [
        'data pipeline', 'etl', 'data modeling', 'data architecture',
        'spark', 'hadoop', 'airflow', 'kafka', 'hive', 'pig',
        'data lakes', 'data warehouses', 'stream processing', 'batch processing',
        'schema design', 'data ingestion', 'data transformation',
        'data quality', 'data governance', 'metadata management',
        'data cataloging', 'data integration', 'data orchestration'
    ],

    'architecture': [
        'architectural design', 'bim', 'revit', 'autocad', '3d modeling',
        'space planning', 'construction documentation', 'site analysis',
        'sustainability', 'green building', 'client meetings', 'design development',
        'project management', 'design presentation', 'rendering', 'sketching',
        'model making', 'construction administration', 'specifications',
        'bill of quantities', 'cost estimation', 'project coordination'
    ],

    'transport_logistics': [
        'route optimization', 'supply chain', 'last mile delivery', 'warehousing',
        'inventory management', 'freight', 'courier', 'shipping', 'logistics planning',
        'distribution', 'reverse logistics', 'procurement', 'supplier management',
        'fleet management', 'delivery routes', 'dispatching', 'transportation management',
        'cargo', 'import/export', 'supply chain analytics', 'warehousing operations'
    ],

    'banking_finance': [
        'credit analysis', 'loan processing', 'branch operations', 'customer relationship',
        'financial advisory', 'wealth management', 'mortgage', 'forex', 'equities',
        'fixed income', 'derivatives', 'risk analysis', 'compliance', 'anti-money laundering',
        'fraud detection', 'transaction processing', 'banking operations', 'loan origination',
        'underwriting', 'customer service', 'branch management', 'bank reconciliation'
    ],

    'aviation': [
        'flight operations', 'air traffic control', 'ground handling', 'aircraft maintenance',
        'flight planning', 'navigation', 'crew coordination', 'passenger safety',
        'airport operations', 'baggage handling', 'cargo loading', 'flight dispatch',
        'aerodrome', 'flight regulations', 'avionics', 'flight simulators',
        'pilot training', 'aviation safety', 'fuel management', 'flight logs'
    ],

    'non_tech': [
        'project management', 'business analysis', 'product management',
        'operations management', 'human resources', 'marketing', 'sales',
        'customer service', 'financial analysis', 'legal', 'administrative support',
        'office management', 'data entry', 'documentation', 'translation',
        'transcription', 'language translation', 'english', 'tagalog', 'spanish',
        'mandarin', 'japanese', 'german', 'french', 'arabic', 'portuguese',
        'italian', 'korean', 'japanese', 'translation tools', 'interpreting'
    ]
}
        
        
        # Flatten the skills list for detection
        self.all_skills = []
        for category, skills in self.skill_categories.items():
            self.all_skills.extend(skills)
        
        # Compile regex patterns for education and experience
        self.education_pattern = re.compile(r'education|degree|university|college|school|academy|institute', re.IGNORECASE)
        self.experience_pattern = re.compile(r'experience|work|employment|job|career|position|role', re.IGNORECASE)
        
    def extract_text_from_pdf(self, pdf_file):
        """Extract text from PDF file"""
        text = ""
        try:
            pdf_reader = PdfReader(pdf_file)
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {e}")
        return text
    
    def extract_text_from_docx(self, docx_file):
        """Extract text from DOCX file"""
        text = ""
        try:
            doc = Document(docx_file)
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
        except Exception as e:
            logger.error(f"Error extracting text from DOCX: {e}")
        return text
    
    def extract_text(self, file):
        """Extract text from various file formats"""
        file_name = file.name.lower()
        
        if file_name.endswith('.pdf'):
            return self.extract_text_from_pdf(file)
        elif file_name.endswith('.docx'):
            return self.extract_text_from_docx(file)
        elif file_name.endswith('.txt'):
            return file.read().decode('utf-8')
        else:
            return "Unsupported file format. Please upload a PDF, DOCX, or TXT file."
    
    def preprocess_text(self, text):
        """Preprocess the extracted text"""
        # Convert to lowercase
        text = text.lower()
        
        # Tokenize with fallback if NLTK punkt is not available
        try:
            tokens = nltk.word_tokenize(text)
        except LookupError:
            # Simple fallback tokenization
            logger.warning("Using fallback tokenization method.")
            tokens = []
            # Split by whitespace and punctuation
            current_token = ""
            for char in text:
                if char.isalnum():
                    current_token += char
                else:
                    if current_token:
                        tokens.append(current_token)
                        current_token = ""
                    if not char.isspace():
                        tokens.append(char)
            if current_token:
                tokens.append(current_token)
        
        # Remove stopwords and non-alphabetic tokens
        filtered_tokens = [token for token in tokens if token.isalpha() and token not in self.stopwords]
        
        return filtered_tokens, text
    def string_similarity(self, a, b):
        """Calculate similarity ratio between two strings (0 to 1)"""
        return SequenceMatcher(None, a.lower(), b.lower()).ratio()
    
    def extract_skills(self, tokens, text):
        """Extract skills from the preprocessed text with improved detection"""
        skills = []
        text_lower = text.lower()
        
        # Check for individual skills in tokens
        for token in tokens:
            if token in self.all_skills and token not in skills:
                skills.append(token)
        
        # Check for multi-word skills in the original text
        for category, category_skills in self.skill_categories.items():
            for phrase in category_skills:
                if ' ' in phrase:
                    pattern = r'\b' + re.escape(phrase) + r'\b'
                    if re.search(pattern, text_lower) and phrase not in skills:
                        skills.append(phrase)
        
        # Check for common skill variations and patterns
        skill_patterns = {
            r'\b(?:experience\s+(?:with|in)|proficient\s+(?:in|with)|skilled\s+(?:in|with))\s+(\w+[\s\w]*)': 'general',
            r'\b(\w+[\s\w]*)\s+(?:skills?|expertise|knowledge|experience|background|familiarity)\b': 'general',
            r'\b(?:market\s+analysis|consumer\s+behavior|customer\s+satisfaction|product\s+launch|business\s+plan|vendor\s+coordination|strategic\s+planning|operations\s+management)\b': 'marketing',
            r'\b(?:financial\s+reporting|budgeting|bookkeeping|expense\s+tracking|cost\s+management)\b': 'finance',
            r'\b(?:team\s+leadership|supervising\s+staff|improving\s+productivity|coaching|performance\s+improvement)\b': 'soft_skills',
            r'\b(?:operations\s+assistant|daily\s+business\s+operations|store\s+activities|office\s+management)\b': 'operations',
            r'\b(?:certified\s+marketing\s+professional|google\s+project\s+management|cmp|project\s+management\s+fundamentals)\b': 'certifications'
        }
        
        for pattern, _ in skill_patterns.items():
            matches = re.finditer(pattern, text_lower, re.IGNORECASE)
            for match in matches:
                matched_skill = match.group(1).strip() if len(match.groups()) >= 1 else match.group(0).strip()
                if matched_skill and matched_skill not in skills:
                    skills.append(match.group(0))
                    
        for skill in list(skills):
            for base_skill in self.all_skills:
                similarity = self.string_similarity(skill, base_skill)
                if similarity > 0.7 and base_skill not in skills:
                    skills.append(base_skill)
        
        # Remove duplicates while preserving order
        unique_skills = []
        for skill in skills:
            if skill not in unique_skills:
                unique_skills.append(skill)
        
        categorized_skills = defaultdict(list)
        for skill in unique_skills:
            matched_category = None
            for category, category_skills in self.skill_categories.items():
                if skill in category_skills:
                    categorized_skills[category].append(skill)
                    matched_category = category
                    break
           
        if not matched_category:
            for category, category_skills in self.skill_categories.items():
                for cat_skill in category_skills:
                    if self._are_similar_skills(skill, cat_skill):
                        categorized_skills[category.append(cat_skill)]
                        matched_category = category
                        break
                if matched_category:
                    break
                
        return unique_skills, dict(categorized_skills)
    
    def extract_education(self, text):
        """Extract education information"""
        education = []
        
        # Use regex-based extraction
        paragraphs = text.split('\n')
        for i, para in enumerate(paragraphs):
            if self.education_pattern.search(para):
                education.append(para.strip())
                # Also include the next paragraph if it's not too long (likely part of the same section)
                if i+1 < len(paragraphs) and len(paragraphs[i+1]) < 200:
                    education.append(paragraphs[i+1].strip())
        
        return education
    
    def extract_experience(self, text):
        """Extract work experience information"""
        experience = []
        
        # Use regex to find experience sections
        paragraphs = text.split('\n')
        for i, para in enumerate(paragraphs):
            if self.experience_pattern.search(para):
                experience.append(para.strip())
                # Also include the next paragraph if it's not too long (likely part of the same section)
                if i+1 < len(paragraphs) and len(paragraphs[i+1]) < 200:
                    # FIX: Changed 'education' to 'experience'
                    experience.append(paragraphs[i+1].strip())
        
        return experience
    
    def load_jobs_from_csv(self, csv_path=None):
        """Load job listings from CSV file with new format (id, title, information)"""
        if csv_path is None:
            # Use default path
            csv_path = os.path.join(settings.BASE_DIR, 'static', 'data', 'job_listings.csv')
            
            # If the file doesn't exist, create a sample one
            if not os.path.exists(csv_path):
                self.create_sample_job_listings(csv_path)
        
        job_listings = []
        
        try:
            import csv
            with open(csv_path, 'r', encoding='utf-8') as csvfile:
                reader = csv.DictReader(csvfile)
                for row in reader:
                    # Extract required skills from information field
                    information = row.get('information', '')
                    required_skills = []
                    
                    # Look for "Required skills:" pattern in information
                    if 'Required skills:' in information:
                        skills_part = information.split('Required skills:')[1].strip()
                        required_skills = [skill.strip() for skill in skills_part.split(';') if skill.strip()]
                    
                    job_listings.append({
                        'id': row.get('id'),
                        'title': row.get('title'),
                        'information': information,
                        'required_skills': required_skills
                    })
        except Exception as e:
            logger.error(f"Error loading jobs from CSV: {e}")
            # Create sample data if there was an error
            job_listings = self.get_sample_job_listings()
        
        return job_listings
    
    def create_sample_job_listings(self, csv_path):
        """Create a sample job listings CSV file with new format"""
        try:
            # Ensure directory exists
            os.makedirs(os.path.dirname(csv_path), exist_ok=True)
            
            import csv
            with open(csv_path, 'w', newline='', encoding='utf-8') as csvfile:
                fieldnames = ['id', 'title', 'information']
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                
                writer.writeheader()
                sample_jobs = [
                    {
                        'id': '1',
                        'title': 'Python Developer',
                        'information': 'We are looking for a Python developer with experience in web development frameworks like Django or Flask. Knowledge of database systems and cloud platforms is a plus. Required skills: python;django;flask;mysql;postgresql;aws'
                    },
                    {
                        'id': '2',
                        'title': 'Full Stack Developer',
                        'information': 'Join our team as a full stack developer working on cutting-edge web applications. Experience with JavaScript frameworks and backend technologies required. Required skills: javascript;react;node.js;mongodb;git;html;css'
                    },
                    {
                        'id': '3',
                        'title': 'Data Scientist',
                        'information': 'Analyze large datasets to extract insights. Experience with Python, R, and machine learning required. Required skills: python;r;machine learning;data analysis;statistics;sql'
                    }
                ]
                
                for job in sample_jobs:
                    writer.writerow(job)
            
            logger.info(f"Created sample job listings CSV at {csv_path}")
        except Exception as e:
            logger.error(f"Error creating sample job listings CSV: {e}")
    
    def get_sample_job_listings(self):
        """Get sample job listings if CSV loading fails"""
        return [
            {
                'id': '1',
                'title': 'Python Developer',
                'information': 'We are looking for a Python developer with experience in web development frameworks like Django or Flask. Knowledge of database systems and cloud platforms is a plus. Required skills: python;django;flask;mysql;postgresql;aws',
                'required_skills': ['python', 'django', 'flask', 'mysql', 'postgresql', 'aws']
            },
            {
                'id': '2',
                'title': 'Full Stack Developer',
                'information': 'Join our team as a full stack developer working on cutting-edge web applications. Experience with JavaScript frameworks and backend technologies required. Required skills: javascript;react;node.js;mongodb;git;html;css',
                'required_skills': ['javascript', 'react', 'node.js', 'mongodb', 'git', 'html', 'css']
            },
            {
                'id': '3',
                'title': 'Data Scientist',
                'information': 'Analyze large datasets to extract insights. Experience with Python, R, and machine learning required. Required skills: python;r;machine learning;data analysis;statistics;sql',
                'required_skills': ['python', 'r', 'machine learning', 'data analysis', 'statistics', 'sql']
            }
        ]
    
    def match_jobs(self, skills, job_listings=None):
        """Match skills with job listings using an improved algorithm"""
        if job_listings is None:
            job_listings = self.load_jobs_from_csv()
        
        if not job_listings:
            return []
        
        job_matches = []
        
        # Convert all skills to lowercase for case-insensitive matching
        lowercase_skills = [skill.lower().strip() for skill in skills]
        
        # Create a set for faster lookup
        skills_set = set(lowercase_skills)
        
        for job in job_listings:
            # Get required skills from the job listing
            required_skills = job.get('required_skills', [])
            if not required_skills:
                continue
        
            # Convert required skills to lowercase and strip whitespace
            lowercase_required = [skill.lower().strip() for skill in required_skills]
        
            # Calculate matches with improved scoring
            exact_matches = 0
            partial_matches = 0
            total_required = len(lowercase_required)
        
            for req_skill in lowercase_required:
                # Check for exact match
                if req_skill in skills_set:
                    exact_matches += 1
                else:
                    # Check for partial matches with better logic
                    found_partial = False
                    for user_skill in lowercase_skills:
                        # Skip very short skills for partial matching
                        if len(req_skill) < 3 or len(user_skill) < 3:
                            continue
                    
                        # Check if one skill contains the other (with minimum length)
                        if (req_skill in user_skill and len(req_skill) >= 3) or \
                           (user_skill in req_skill and len(user_skill) >= 3):
                            partial_matches += 1
                            found_partial = True
                            break
                    
                        # Check for similar skills (e.g., "javascript" vs "js")
                        if self._are_similar_skills(req_skill, user_skill):
                            partial_matches += 1
                            found_partial = True
                            break
        
            # Calculate weighted score
            if total_required > 0:
                # Exact matches get full weight, partial matches get half weight
                weighted_score = (exact_matches + (partial_matches * 0.5)) / total_required
            
                # Bonus for having more skills than required
                if len(lowercase_skills) > total_required:
                    bonus = min(0.1, (len(lowercase_skills) - total_required) * 0.02)
                    weighted_score += bonus
            
                # Only include jobs with at least some match
                if weighted_score >= 0.1:  # 10% minimum threshold
                    job_matches.append((job, weighted_score))
    
        # Sort by match percentage (highest first)
        job_matches.sort(key=lambda x: x[1], reverse=True)
    
        # Debug output
        logger.info(f"User skills: {lowercase_skills}")
        logger.info(f"Found {len(job_matches)} job matches")
        for job, score in job_matches[:5]:  # Log top 5 matches
            logger.info(f"Match: {job['title']} - {score:.2%}")
    
        # If no matches found, try with lower threshold
        if not job_matches:
            logger.info("No matches with 10% threshold, trying with 5%")
            for job in job_listings:
                required_skills = job.get('required_skills', [])
                if not required_skills:
                    continue
            
                lowercase_required = [skill.lower().strip() for skill in required_skills]
                matches = sum(1 for req_skill in lowercase_required if req_skill in skills_set)
            
                if matches > 0:
                    score = matches / len(lowercase_required)
                    job_matches.append((job, score))
        
            job_matches.sort(key=lambda x: x[1], reverse=True)
    
        # Return top 10 matches to avoid overwhelming the user
        return job_matches[:10]

    def analyze(self, file, job_listings=None):
        """Main method to analyze a resume"""
        # Extract text from file
        text = self.extract_text(file)
        
        # Preprocess text
        tokens, processed_text = self.preprocess_text(text)
        
        # Extract skills
        skills, categorized_skills = self.extract_skills(tokens, processed_text)
        
        # Extract education and experience
        education = self.extract_education(text)
        experience = self.extract_experience(text)
        
        # Match with job listings
        if job_listings is None:
            job_listings = self.load_jobs_from_csv()
        
        job_matches = self.match_jobs(skills, job_listings)
        
        # Return analysis results
        return {
            'skills': skills,
            'categorized_skills': categorized_skills,
            'education': education,
            'experience': experience,
            'job_matches': job_matches
        }

    def _are_similar_skills(self, skill1, skill2):
        """Check if two skills are similar (e.g., javascript vs js, python vs py)"""
        # Define skill synonyms
        synonyms = {
            'javascript': ['js', 'ecmascript'],
            'python': ['py'],
            'typescript': ['ts'],
            'artificial intelligence': ['ai', 'machine learning', 'ml'],
            'machine learning': ['ml', 'ai', 'artificial intelligence'],
            'database': ['db', 'databases'],
            'postgresql': ['postgres'],
            'mongodb': ['mongo'],
            'node.js': ['nodejs', 'node'],
            'react.js': ['react', 'reactjs'],
            'vue.js': ['vue', 'vuejs'],
            'angular.js': ['angular', 'angularjs'],
            'c++': ['cpp', 'cplusplus'],
            'c#': ['csharp', 'c-sharp'],
            'asp.net': ['aspnet', 'asp'],
            'jquery': ['jq'],
            'css3': ['css'],
            'html5': ['html'],
            'amazon web services': ['aws'],
            'google cloud platform': ['gcp', 'google cloud'],
            'microsoft azure': ['azure'],
            'continuous integration': ['ci'],
            'continuous deployment': ['cd'],
            'ci/cd': ['continuous integration', 'continuous deployment'],
            'user interface': ['ui'],
            'user experience': ['ux'],
            'application programming interface': ['api'],
            'rest api': ['restful', 'rest'],
            'graphql': ['graph ql'],
            'nosql': ['no sql'],
            'sql server': ['mssql', 'microsoft sql server'],
            'natural language processing': ['nlp'],
            'computer vision': ['cv'],
            'deep learning': ['dl'],
            'data science': ['ds'],
            'business intelligence': ['bi'],
            'enterprise resource planning': ['erp'],
            'customer relationship management': ['crm'],
            'software development': ['dev', 'development'],
            'full stack': ['fullstack'],
            'front end': ['frontend'],
            'back end': ['backend'],
            'devops': ['dev ops'],
            'quality assurance': ['qa'],
            'test driven development': ['tdd'],
            'behavior driven development': ['bdd'],
            'object oriented programming': ['oop'],
            'functional programming': ['fp'],
            'model view controller': ['mvc'],
            'representational state transfer': ['rest'],
            'simple object access protocol': ['soap'],
            'extensible markup language': ['xml'],
            'javascript object notation': ['json'],
            'cascading style sheets': ['css'],
            'hypertext markup language': ['html'],
            'structured query language': ['sql'],
            'php hypertext preprocessor': ['php'],
            'gnu general public license': ['gpl'],
            'mit license': ['mit'],
            'apache license': ['apache'],
            'internet of things': ['iot'],
            'augmented reality': ['ar'],
            'virtual reality': ['vr'],
            'mixed reality': ['mr'],
            'blockchain': ['distributed ledger'],
            'cryptocurrency': ['crypto'],
            'big data': ['large scale data'],
            'cloud computing': ['cloud'],
            'edge computing': ['edge'],
            'serverless': ['function as a service', 'faas'],
            'microservices': ['micro services'],
            'containerization': ['containers'],
            'virtualization': ['virtual machines', 'vm'],
            'load balancing': ['load balancer'],
            'content delivery network': ['cdn'],
            'search engine optimization': ['seo'],
            'social media marketing': ['smm'],
            'pay per click': ['ppc'],
            'conversion rate optimization': ['cro'],
            'key performance indicator': ['kpi'],
            'return on investment': ['roi'],
            'software as a service': ['saas'],
            'platform as a service': ['paas'],
            'infrastructure as a service': ['iaas'],
            'business to business': ['b2b'],
            'business to consumer': ['b2c'],
            'customer to customer': ['c2c'],
            'business to government': ['b2g'],
            'minimum viable product': ['mvp'],
            'proof of concept': ['poc'],
            'research and development': ['r&d', 'rnd'],
            'information technology': ['it'],
            'human resources': ['hr'],
            'public relations': ['pr'],
            'chief executive officer': ['ceo'],
            'chief technology officer': ['cto'],
            'chief information officer': ['cio'],
            'chief financial officer': ['cfo'],
            'chief operating officer': ['coo'],
            'chief marketing officer': ['cmo'],
            'chief data officer': ['cdo'],
            'chief security officer': ['cso'],
            'chief product officer': ['cpo'],
            'vice president': ['vp'],
            'senior vice president': ['svp'],
            'executive vice president': ['evp'],
            'assistant vice president': ['avp'],
            'project management': ['pm'],
            'program management': ['pgm'],
            'product management': ['product mgmt'],
            'operations management': ['ops mgmt'],
            'supply chain management': ['scm'],
            'customer success management': ['csm'],
            'account management': ['am'],
            'business development': ['bd', 'biz dev'],
            'sales development': ['sd'],
            'marketing development': ['md'],
            'software development': ['sw dev'],
            'web development': ['web dev'],
            'mobile development': ['mobile dev'],
            'game development': ['game dev'],
            'application development': ['app dev'],
            'system development': ['sys dev'],
            'database development': ['db dev'],
            'api development': ['api dev'],
            'frontend development': ['fe dev'],
            'backend development': ['be dev'],
            'fullstack development': ['fs dev'],
            'data analysis': ['data analytics'],
            'business analysis': ['ba'],
            'system analysis': ['sa'],
            'financial analysis': ['fa'],
            'market analysis': ['ma'],
            'competitive analysis': ['ca'],
            'risk analysis': ['ra'],
            'performance analysis': ['pa'],
            'user research': ['ux research'],
            'market research': ['market research'],
            'product research': ['product research'],
            'technology research': ['tech research'],
            'academic research': ['academic research'],
            'clinical research': ['clinical research'],
            'scientific research': ['scientific research'],
            'social research': ['social research'],
            'economic research': ['economic research'],
            'environmental research': ['environmental research'],
            'medical research': ['medical research'],
            'pharmaceutical research': ['pharma research'],
            'biotechnology research': ['biotech research'],
            'nanotechnology research': ['nanotech research'],
            'information security': ['infosec'],
            'cybersecurity': ['cyber security'],
            'network security': ['netsec'],
            'application security': ['appsec'],
            'cloud security': ['cloud sec'],
            'data security': ['data sec'],
            'endpoint security': ['endpoint sec'],
            'mobile security': ['mobile sec'],
            'web security': ['web sec'],
            'email security': ['email sec'],
            'identity management': ['idm'],
            'access management': ['am'],
            'privileged access management': ['pam'],
            'single sign on': ['sso'],
            'multi factor authentication': ['mfa'],
            'two factor authentication': ['2fa'],
            'public key infrastructure': ['pki'],
            'certificate authority': ['ca'],
            'digital certificate': ['cert'],
            'secure sockets layer': ['ssl'],
            'transport layer security': ['tls'],
            'virtual private network': ['vpn'],
            'intrusion detection system': ['ids'],
            'intrusion prevention system': ['ips'],
            'security information and event management': ['siem'],
            'security orchestration automation and response': ['soar'],
            'endpoint detection and response': ['edr'],
            'extended detection and response': ['xdr'],
            'managed detection and response': ['mdr'],
            'threat intelligence': ['ti'],
            'threat hunting': ['th'],
            'incident response': ['ir'],
            'disaster recovery': ['dr'],
            'business continuity': ['bc'],
            'risk management': ['rm'],
            'compliance management': ['cm'],
            'governance risk and compliance': ['grc'],
            'privacy by design': ['pbd'],
            'general data protection regulation': ['gdpr'],
            'california consumer privacy act': ['ccpa'],
            'health insurance portability and accountability act': ['hipaa'],
            'sarbanes oxley act': ['sox'],
            'payment card industry data security standard': ['pci dss'],
            'international organization for standardization': ['iso'],
            'national institute of standards and technology': ['nist'],
            'center for internet security': ['cis'],
            'open web application security project': ['owasp'],
            'sans institute': ['sans'],
            'certified information systems security professional': ['cissp'],
            'certified ethical hacker': ['ceh'],
            'certified information security manager': ['cism'],
            'certified information systems auditor': ['cisa'],
            'certified in risk and information systems control': ['crisc'],
            'certified cloud security professional': ['ccsp'],
            'certified information privacy professional': ['cipp'],
            'certified information privacy manager': ['cipm'],
            'certified information privacy technologist': ['cipt'],
            'certified data protection officer': ['cdpo'],
            'certified privacy professional': ['cpp'],
            'certified privacy technologist': ['cpt'],
            'certified privacy manager': ['cpm'],
            'certified privacy analyst': ['cpa'],
            'certified privacy engineer': ['cpe'],
            'certified privacy consultant': ['cpc'],
            'certified privacy auditor': ['cpa'],
            'certified privacy researcher': ['cpr'],
            'certified privacy educator': ['cpe'],
            'certified privacy advocate': ['cpa'],
            'certified privacy specialist': ['cps'],
            'certified privacy expert': ['cpe'],
            'certified privacy professional europe': ['cppe'],
            'certified privacy professional canada': ['cppc'],
            'certified privacy professional asia': ['cppa'],
            'certified privacy professional australia': ['cppa'],
            'certified privacy professional united states': ['cppus'],
            'certified privacy professional global': ['cppg'],
            'certified privacy professional international': ['cppi'],
            'certified privacy professional multinational': ['cppm'],
            'certified privacy professional transnational': ['cppt'],
            'certified privacy professional cross border': ['cppcb'],
            'certified privacy professional multi jurisdictional': ['cppmj'],
            'certified privacy professional pan regional': ['cpppr'],
            'certified privacy professional worldwide': ['cppw'],
            'certified privacy professional universal': ['cppu'],
            'certified privacy professional comprehensive': ['cppc'],
            'certified privacy professional advanced': ['cppa'],
            'certified privacy professional expert': ['cppe'],
            'certified privacy professional master': ['cppm'],
            'certified privacy professional senior': ['cpps'],
            'certified privacy professional principal': ['cppp'],
            'certified privacy professional lead': ['cppl'],
            'certified privacy professional chief': ['cppc'],
            'certified privacy professional executive': ['cppe'],
            'certified privacy professional director': ['cppd'],
            'certified privacy professional manager': ['cppm'],
            'certified privacy professional supervisor': ['cpps'],
            'certified privacy professional coordinator': ['cppc'],
            'certified privacy professional administrator': ['cppa'],
            'certified privacy professional officer': ['cppo'],
            'certified privacy professional analyst': ['cppa'],
            'certified privacy professional consultant': ['cppc'],
            'certified privacy professional advisor': ['cppa'],
            'certified privacy professional specialist': ['cpps'],
            'certified privacy professional technician': ['cppt'],
            'certified privacy professional associate': ['cppa'],
            'certified privacy professional assistant': ['cppa'],
            'certified privacy professional intern': ['cppi'],
            'certified privacy professional trainee': ['cppt'],
            'certified privacy professional apprentice': ['cppa'],
            'certified privacy professional student': ['cpps'],
            'certified privacy professional candidate': ['cppc'],
            'certified privacy professional applicant': ['cppa'],
            'certified privacy professional nominee': ['cppn'],
            'certified privacy professional designee': ['cppd'],
            'certified privacy professional representative': ['cppr'],
            'certified privacy professional delegate': ['cppd'],
            'certified privacy professional proxy': ['cppp'],
            'certified privacy professional substitute': ['cpps'],
            'certified privacy professional replacement': ['cppr'],
            'certified privacy professional backup': ['cppb'],
            'certified privacy professional alternate': ['cppa'],
            'certified privacy professional standby': ['cpps'],
            'certified privacy professional reserve': ['cppr'],
            'certified privacy professional emergency': ['cppe'],
            'certified privacy professional temporary': ['cppt'],
            'certified privacy professional interim': ['cppi'],
            'certified privacy professional acting': ['cppa'],
            'certified privacy professional provisional': ['cppp'],
            'certified privacy professional conditional': ['cppc'],
            'certified privacy professional probationary': ['cppp'],
            'certified privacy professional trial': ['cppt'],
            'certified privacy professional pilot': ['cppp'],
            'certified privacy professional experimental': ['cppe'],
            'certified privacy professional prototype': ['cppp'],
            'certified privacy professional beta': ['cppb'],
            'certified privacy professional alpha': ['cppa'],
            'certified privacy professional development': ['cppd'],
            'certified privacy professional testing': ['cppt'],
            'certified privacy professional quality assurance': ['cppqa'],
            'certified privacy professional quality control': ['cppqc'],
            'certified privacy professional validation': ['cppv'],
            'certified privacy professional verification': ['cppv'],
            'certified privacy professional certification': ['cppc'],
            'certified privacy professional accreditation': ['cppa'],
            'certified privacy professional authorization': ['cppa'],
            'certified privacy professional approval': ['cppa'],
            'certified privacy professional endorsement': ['cppe'],
            'certified privacy professional recommendation': ['cppr'],
            'certified privacy professional referral': ['cppr'],
            'certified privacy professional nomination': ['cppn'],
            'certified privacy professional selection': ['cpps'],
            'certified privacy professional appointment': ['cppa'],
            'certified privacy professional assignment': ['cppa'],
            'certified privacy professional deployment': ['cppd'],
            'certified privacy professional implementation': ['cppi'],
            'certified privacy professional execution': ['cppe'],
            'certified privacy professional operation': ['cppo'],
            'certified privacy professional maintenance': ['cppm'],
            'certified privacy professional support': ['cpps'],
            'certified privacy professional service': ['cpps'],
            'certified privacy professional assistance': ['cppa'],
            'certified privacy professional help': ['cpph'],
            'certified privacy professional aid': ['cppa'],
            'certified privacy professional guidance': ['cppg'],
            'certified privacy professional direction': ['cppd'],
            'certified privacy professional instruction': ['cppi'],
            'certified privacy professional education': ['cppe'],
            'certified privacy professional training': ['cppt'],
            'certified privacy professional coaching': ['cppc'],
            'certified privacy professional mentoring': ['cppm'],
            'certified privacy professional tutoring': ['cppt'],
            'certified privacy professional teaching': ['cppt'],
            'certified privacy professional learning': ['cppl'],
            'certified privacy professional development': ['cppd'],
            'certified privacy professional improvement': ['cppi'],
            'certified privacy professional enhancement': ['cppe'],
            'certified privacy professional advancement': ['cppa'],
            'certified privacy professional progression': ['cppp'],
            'certified privacy professional evolution': ['cppe'],
            'certified privacy professional growth': ['cppg'],
            'certified privacy professional expansion': ['cppe'],
            'certified privacy professional extension': ['cppe'],
            'certified privacy professional enlargement': ['cppe'],
            'certified privacy professional increase': ['cppi'],
            'certified privacy professional augmentation': ['cppa'],
            'certified privacy professional amplification': ['cppa'],
            'certified privacy professional magnification': ['cppm'],
            'certified privacy professional intensification': ['cppi'],
            'certified privacy professional strengthening': ['cpps'],
            'certified privacy professional reinforcement': ['cppr'],
            'certified privacy professional consolidation': ['cppc'],
            'certified privacy professional integration': ['cppi'],
            'certified privacy professional unification': ['cppu'],
            'certified privacy professional coordination': ['cppc'],
            'certified privacy professional synchronization': ['cpps'],
            'certified privacy professional harmonization': ['cpph'],
            'certified privacy professional standardization': ['cpps'],
            'certified privacy professional normalization': ['cppn']
        }
        
        # Check if skills are similar based on synonyms
        for base_skill, synonyms in synonyms.items():
            if skill1 == base_skill and skill2 in synonyms:
                return True
            if skill2 == base_skill and skill1 in synonyms:
                return True
            if skill1 in synonyms and skill2 in synonyms:
                return True
        
        # Check for common abbreviations and variations
        if len(skill1) >= 3 and len(skill2) >= 3:
            # Check if one is an abbreviation of the other
            if skill1.startswith(skill2[:3]) or skill2.startswith(skill1[:3]):
                return True
        
        return False
        
