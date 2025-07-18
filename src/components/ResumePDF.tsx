import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  pdf
} from '@react-pdf/renderer';

// Define fonts (you can add custom fonts later)
Font.register({
  family: 'Helvetica',
  src: 'Helvetica'
});

Font.register({
  family: 'Helvetica-Bold',
  src: 'Helvetica-Bold'
});

// Styles for different templates
const createStyles = (template: string) => {
  const baseStyles = StyleSheet.create({
    page: {
      padding: 30,
      fontFamily: 'Helvetica',
      fontSize: 10,
      lineHeight: 1.4,
      color: '#333'
    },
    header: {
      marginBottom: 20,
      borderBottom: '1px solid #333',
      paddingBottom: 10
    },
    name: {
      fontSize: 24,
      fontFamily: 'Helvetica-Bold',
      marginBottom: 5,
      color: '#2c3e50'
    },
    contactInfo: {
      fontSize: 9,
      color: '#666',
      marginBottom: 5
    },
    section: {
      marginBottom: 15
    },
    sectionTitle: {
      fontSize: 14,
      fontFamily: 'Helvetica-Bold',
      marginBottom: 8,
      color: '#2c3e50',
      borderBottom: '1px solid #eee',
      paddingBottom: 3
    },
    jobTitle: {
      fontSize: 12,
      fontFamily: 'Helvetica-Bold',
      marginBottom: 2
    },
    companyInfo: {
      fontSize: 10,
      color: '#666',
      marginBottom: 5
    },
    bulletPoint: {
      fontSize: 9,
      marginBottom: 3,
      paddingLeft: 10
    },
    skillItem: {
      fontSize: 9,
      marginBottom: 2
    },
    projectTitle: {
      fontSize: 11,
      fontFamily: 'Helvetica-Bold',
      marginBottom: 2
    },
    projectInfo: {
      fontSize: 9,
      color: '#666',
      marginBottom: 3
    },
    summary: {
      fontSize: 10,
      marginBottom: 15,
      textAlign: 'justify'
    }
  });

  // Template-specific styles
  switch (template) {
    case 'modern':
      return {
        ...baseStyles,
        page: {
          ...baseStyles.page,
          backgroundColor: '#ffffff'
        },
        name: {
          ...baseStyles.name,
          color: '#3498db'
        },
        sectionTitle: {
          ...baseStyles.sectionTitle,
          color: '#3498db',
          borderBottom: '2px solid #3498db'
        }
      };
    
    case 'professional':
      return {
        ...baseStyles,
        page: {
          ...baseStyles.page,
          backgroundColor: '#ffffff'
        },
        name: {
          ...baseStyles.name,
          color: '#2c3e50'
        },
        sectionTitle: {
          ...baseStyles.sectionTitle,
          color: '#2c3e50',
          borderBottom: '1px solid #2c3e50'
        }
      };
    
    case 'creative':
      return {
        ...baseStyles,
        page: {
          ...baseStyles.page,
          backgroundColor: '#f8f9fa'
        },
        name: {
          ...baseStyles.name,
          color: '#e74c3c'
        },
        sectionTitle: {
          ...baseStyles.sectionTitle,
          color: '#e74c3c',
          borderBottom: '2px solid #e74c3c'
        }
      };
    
    case 'minimal':
      return {
        ...baseStyles,
        page: {
          ...baseStyles.page,
          backgroundColor: '#ffffff'
        },
        name: {
          ...baseStyles.name,
          color: '#000000'
        },
        sectionTitle: {
          ...baseStyles.sectionTitle,
          color: '#000000',
          borderBottom: '1px solid #000000'
        }
      };
    
    default:
      return baseStyles;
  }
};

interface ResumePDFProps {
  content: {
    personalInfo: {
      name: string;
      email: string;
      phone: string;
      location: string;
      linkedin: string;
      portfolio: string;
    };
    summary: string;
    experience: any[];
    skills: any[];
    projects: any[];
    education: any[];
    certifications: any[];
  };
  template: string;
}

const ResumePDF: React.FC<ResumePDFProps> = ({ content, template }) => {
  const styles = createStyles(template);

  const formatContactInfo = () => {
    const { email, phone, location, linkedin, portfolio } = content.personalInfo;
    const contactParts = [email, phone, location].filter(Boolean);
    const links = [];
    
    if (linkedin) links.push(`LinkedIn: ${linkedin}`);
    if (portfolio) links.push(`Portfolio: ${portfolio}`);
    
    return [...contactParts, ...links].join(' | ');
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{content.personalInfo.name}</Text>
          <Text style={styles.contactInfo}>{formatContactInfo()}</Text>
        </View>

        {/* Professional Summary */}
        {content.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PROFESSIONAL SUMMARY</Text>
            <Text style={styles.summary}>{content.summary}</Text>
          </View>
        )}

        {/* Experience */}
        {content.experience.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>EXPERIENCE</Text>
            {content.experience.map((job, index) => (
              <View key={index} style={{ marginBottom: 10 }}>
                <Text style={styles.jobTitle}>{job.title} at {job.company}</Text>
                <Text style={styles.companyInfo}>{job.startDate} - {job.endDate}</Text>
                {job.bulletPoints.map((point: string, pointIndex: number) => (
                  <Text key={pointIndex} style={styles.bulletPoint}>
                    • {point}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Skills */}
        {content.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SKILLS</Text>
            <Text style={styles.skillItem}>
              {content.skills.map(skill => `${skill.name} (${skill.category})`).join(', ')}
            </Text>
          </View>
        )}

        {/* Projects */}
        {content.projects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PROJECTS</Text>
            {content.projects.map((project, index) => (
              <View key={index} style={{ marginBottom: 8 }}>
                <Text style={styles.projectTitle}>{project.name}</Text>
                <Text style={styles.projectInfo}>
                  {project.technologies} - {project.role} ({project.duration})
                </Text>
                <Text style={styles.bulletPoint}>{project.description}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {content.education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>EDUCATION</Text>
            {content.education.map((edu, index) => (
              <View key={index} style={{ marginBottom: 8 }}>
                <Text style={styles.jobTitle}>{edu.degree} - {edu.institution}</Text>
                <Text style={styles.companyInfo}>
                  {edu.graduationDate}{edu.gpa ? ` | GPA: ${edu.gpa}` : ''}
                </Text>
                {edu.relevantCourses && (
                  <Text style={styles.bulletPoint}>
                    Relevant Courses: {edu.relevantCourses}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Certifications */}
        {content.certifications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>CERTIFICATIONS</Text>
            {content.certifications.map((cert, index) => (
              <View key={index} style={{ marginBottom: 5 }}>
                <Text style={styles.jobTitle}>{cert.name} - {cert.issuer}</Text>
                <Text style={styles.companyInfo}>
                  {cert.date}{cert.url ? ` | ${cert.url}` : ''}
                </Text>
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
};

// Function to generate and download PDF
export const generatePDF = async (content: any, template: string, filename: string) => {
  const blob = await pdf(<ResumePDF content={content} template={template} />).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default ResumePDF; 