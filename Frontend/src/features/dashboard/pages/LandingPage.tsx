import React from 'react';
import { Button, Card, Row, Col, Typography, Space, Avatar, Divider } from 'antd';
import {
  RobotOutlined,
  FastForwardOutlined,
  SecurityScanOutlined,
  CloudOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
  SafetyOutlined,
  GlobalOutlined,
  ApiOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  GithubOutlined,
  TwitterOutlined,
  LinkedinOutlined,
  StarFilled
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { colors } from '../../../theme/colors';
import { LandingNavbar } from '../../../shared/components/layout/LandingNavbar';
import './LandingPage.css';

const { Title, Paragraph, Text } = Typography;

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem('authToken');

  const features = [
    {
      icon: <RobotOutlined style={{ fontSize: '48px', color: colors.primary[500] }} />,
      title: 'AI-Powered Extraction',
      description: 'Advanced machine learning algorithms analyze fashion images and extract detailed product attributes automatically.',
    },
    {
      icon: <FastForwardOutlined style={{ fontSize: '48px', color: colors.success[500] }} />,
      title: 'Lightning Fast',
      description: 'Process hundreds of images in minutes. Our optimized pipeline handles bulk operations with ease.',
    },
    {
      icon: <SecurityScanOutlined style={{ fontSize: '48px', color: colors.error[500] }} />,
      title: 'High Accuracy',
      description: 'Over 95% accuracy in attribute detection with confidence scores for each extracted data point.',
    },
    {
      icon: <CloudOutlined style={{ fontSize: '48px', color: '#722ed1' }} />,
      title: 'Cloud-Based',
      description: 'Scalable cloud infrastructure ensures reliable performance and data security.',
    },
    {
      icon: <ThunderboltOutlined style={{ fontSize: '48px', color: colors.warning[500] }} />,
      title: 'Real-Time Processing',
      description: 'Get instant results with our optimized real-time processing engine for immediate insights.',
    },
    {
      icon: <SafetyOutlined style={{ fontSize: '48px', color: colors.info[500] }} />,
      title: 'Enterprise Security',
      description: 'Bank-level encryption and security protocols to keep your data safe and compliant.',
    },
    {
      icon: <GlobalOutlined style={{ fontSize: '48px', color: colors.primary[600] }} />,
      title: 'Multi-Language Support',
      description: 'Extract attributes in multiple languages with our global AI models supporting 50+ languages.',
    },
    {
      icon: <ApiOutlined style={{ fontSize: '48px', color: colors.success[600] }} />,
      title: 'REST API Access',
      description: 'Integrate seamlessly with your existing systems using our comprehensive REST API.',
    },
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Product Manager, FashionHub',
      avatar: 'S',
      rating: 5,
      text: 'AI Fashion Extractor has revolutionized our product cataloging process. What used to take days now takes hours!',
    },
    {
      name: 'Michael Chen',
      role: 'CTO, StyleTech',
      avatar: 'M',
      rating: 5,
      text: 'The accuracy is impressive. We\'ve processed over 100,000 images with 95%+ accuracy. Highly recommended!',
    },
    {
      name: 'Emily Rodriguez',
      role: 'E-commerce Director, TrendyWear',
      avatar: 'E',
      rating: 5,
      text: 'Best investment we\'ve made. The API integration was seamless and the support team is fantastic.',
    },
  ];

  const stats = [
    { title: '1M+', description: 'Images Processed' },
    { title: '95%', description: 'Accuracy Rate' },
    { title: '500+', description: 'Happy Customers' },
    { title: '24/7', description: 'Support Available' },
  ];

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/register');
    }
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Professional Navbar */}
      <LandingNavbar transparent={true} fixed={true} />

      {/* Hero Section */}
      <div style={{ 
        background: 'linear-gradient(135deg, #FF6F61 0%, #FFA62B 100%)'
      }}>
      <div style={{ 
        padding: '100px 24px 80px', 
        textAlign: 'center', 
        color: '#fff',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <Title 
          level={1} 
          style={{ 
            color: '#fff', 
            fontSize: '3.5rem', 
            marginBottom: '24px',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
          }}
        >
          AI Fashion Extractor
        </Title>
        
        <Paragraph 
          style={{ 
            fontSize: '1.25rem', 
            color: 'rgba(255,255,255,0.9)', 
            marginBottom: '40px',
            maxWidth: '600px',
            margin: '0 auto 40px'
          }}
        >
          Transform your fashion catalog with intelligent AI-powered image analysis. 
          Extract detailed product attributes, colors, patterns, and more in seconds.
        </Paragraph>

        <Space size="large">
          <Button 
            type="primary" 
            size="large"
            icon={<ArrowRightOutlined />}
            onClick={handleGetStarted}
            style={{
              height: '50px',
              paddingLeft: '32px',
              paddingRight: '32px',
              fontSize: '16px',
              background: 'rgba(255,255,255,0.2)',
              borderColor: 'rgba(255,255,255,0.3)',
              backdropFilter: 'blur(10px)',
            }}
          >
            {isAuthenticated ? 'Go to Dashboard' : 'Get Started Free'}
          </Button>
          
          {!isAuthenticated && (
            <Button 
              size="large"
              onClick={() => navigate('/login')}
              style={{
                height: '50px',
                paddingLeft: '32px',
                paddingRight: '32px',
                fontSize: '16px',
                background: 'transparent',
                borderColor: 'rgba(255,255,255,0.5)',
                color: '#fff',
              }}
            >
              Sign In
            </Button>
          )}
        </Space>
      </div>

      {/* Stats Section */}
      <div style={{ 
        background: 'rgba(255,255,255,0.1)', 
        backdropFilter: 'blur(20px)',
        padding: '60px 24px',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <Row gutter={[32, 32]} justify="center">
            {stats.map((stat, index) => (
              <Col xs={12} sm={6} key={index}>
                <div style={{ textAlign: 'center' }}>
                  <div>
                    <div style={{ 
                      color: '#fff', 
                      fontSize: '2.5rem', 
                      fontWeight: 'bold',
                      textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                      marginBottom: '8px'
                    }}>
                      {stat.title}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>
                      {stat.description}
                    </div>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" style={{ 
        background: '#fff', 
        padding: '100px 24px',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <Title level={2} style={{ marginBottom: '16px' }}>
              Powerful Features for Fashion Intelligence
            </Title>
            <Paragraph style={{ fontSize: '18px', color: '#666', maxWidth: '600px', margin: '0 auto' }}>
              Everything you need to transform your fashion catalog with cutting-edge AI technology.
            </Paragraph>
          </div>

          <Row gutter={[24, 24]}>
            {features.map((feature, index) => (
              <Col xs={24} sm={12} lg={6} key={index}>
                <Card
                  hoverable
                  className="feature-card"
                  style={{
                    height: '100%',
                    textAlign: 'center',
                    border: 'none',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    borderRadius: '16px',
                    transition: 'all 0.3s ease',
                  }}
                  styles={{ body: { padding: '32px 20px' } }}
                >
                  <div style={{ marginBottom: '20px' }}>
                    {feature.icon}
                  </div>
                  <Title level={4} style={{ marginBottom: '12px', fontSize: '18px' }}>
                    {feature.title}
                  </Title>
                  <Paragraph style={{ color: colors.text.secondary, lineHeight: 1.6, fontSize: '14px', margin: 0 }}>
                    {feature.description}
                  </Paragraph>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </div>

      {/* How It Works Section */}
      <div id="how-it-works" style={{ 
        background: '#f8f9fa', 
        padding: '100px 24px',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <Title level={2} style={{ marginBottom: '16px' }}>
              How It Works
            </Title>
            <Paragraph style={{ fontSize: '18px', color: '#666' }}>
              Simple 3-step process to extract fashion data
            </Paragraph>
          </div>

          <Row gutter={[48, 48]} align="middle">
            <Col xs={24} md={8}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'linear-gradient(45deg, #FF6F61, #FFA62B)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px',
                  color: '#fff',
                  fontSize: '32px',
                  fontWeight: 'bold',
                }}>
                  1
                </div>
                <Title level={4}>Upload Images</Title>
                <Paragraph style={{ color: '#666' }}>
                  Upload your fashion product images in bulk or individually
                </Paragraph>
              </div>
            </Col>

            <Col xs={24} md={8}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'linear-gradient(45deg, #FF6F61, #FFA62B)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px',
                  color: '#fff',
                  fontSize: '32px',
                  fontWeight: 'bold',
                }}>
                  2
                </div>
                <Title level={4}>AI Analysis</Title>
                <Paragraph style={{ color: '#666' }}>
                  Our AI analyzes images and extracts detailed product attributes
                </Paragraph>
              </div>
            </Col>

            <Col xs={24} md={8}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'linear-gradient(45deg, #fa541c, #ff7a45)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px',
                  color: '#fff',
                  fontSize: '32px',
                  fontWeight: 'bold',
                }}>
                  3
                </div>
                <Title level={4}>Export Data</Title>
                <Paragraph style={{ color: '#666' }}>
                  Download structured data in Excel, CSV, or JSON format
                </Paragraph>
              </div>
            </Col>
          </Row>
        </div>
      </div>

      {/* Testimonials Section */}
      <div id="testimonials" style={{ 
        background: '#fff',
        padding: '100px 24px',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <Title level={2} style={{ marginBottom: '16px' }}>
              Trusted by Fashion Leaders
            </Title>
            <Paragraph style={{ fontSize: '18px', color: colors.text.secondary }}>
              See what our customers say about their experience
            </Paragraph>
          </div>

          <Row gutter={[32, 32]}>
            {testimonials.map((testimonial, index) => (
              <Col xs={24} md={8} key={index}>
                <Card
                  className="testimonial-card"
                  style={{
                    height: '100%',
                    borderRadius: '16px',
                    border: '1px solid #f0f0f0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  }}
                  styles={{ body: { padding: '32px' } }}
                >
                  <div style={{ marginBottom: '20px' }}>
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <StarFilled key={i} style={{ color: colors.warning[500], fontSize: '18px', marginRight: '4px' }} />
                    ))}
                  </div>
                  <Paragraph style={{ 
                    fontSize: '15px', 
                    lineHeight: 1.8, 
                    color: colors.text.primary,
                    marginBottom: '24px',
                    fontStyle: 'italic'
                  }}>
                    "{testimonial.text}"
                  </Paragraph>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Avatar 
                      size={48} 
                      style={{ 
                        background: `linear-gradient(135deg, ${colors.primary[500]} 0%, ${colors.primary[600]} 100%)`,
                        fontSize: '20px',
                        fontWeight: 'bold'
                      }}
                    >
                      {testimonial.avatar}
                    </Avatar>
                    <div>
                      <div style={{ fontWeight: 600, color: colors.text.primary, marginBottom: '4px' }}>
                        {testimonial.name}
                      </div>
                      <div style={{ fontSize: '13px', color: colors.text.secondary }}>
                        {testimonial.role}
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </div>

      {/* CTA Section */}
      <div style={{ 
        background: `linear-gradient(135deg, ${colors.primary[500]} 0%, #722ed1 100%)`,
        padding: '80px 24px',
        color: '#fff',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <Title level={2} style={{ color: '#fff', marginBottom: '24px' }}>
            Ready to Transform Your Fashion Catalog?
          </Title>
          <Paragraph style={{ fontSize: '18px', color: 'rgba(255,255,255,0.9)', marginBottom: '40px' }}>
            Join thousands of fashion businesses using AI to streamline their product data management.
          </Paragraph>
          
          <Space size="large" direction="vertical">
            <Button 
              type="primary" 
              size="large"
              icon={<CheckCircleOutlined />}
              onClick={handleGetStarted}
              style={{
                height: '50px',
                paddingLeft: '40px',
                paddingRight: '40px',
                fontSize: '16px',
                background: '#fff',
                borderColor: '#fff',
                color: '#FF6F61',
              }}
            >
              {isAuthenticated ? 'Start Extracting Now' : 'Start Free Trial'}
            </Button>
            
            <Text style={{ color: 'rgba(255,255,255,0.8)' }}>
              No credit card required • Free 14-day trial • Cancel anytime
            </Text>
          </Space>
        </div>
      </div>

      {/* Footer Section */}
      <div style={{ 
        background: colors.neutral[900],
        padding: '60px 24px 24px',
        color: colors.neutral[100]
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <Row gutter={[48, 48]}>
            <Col xs={24} sm={12} md={6}>
              <Title level={4} style={{ color: '#fff', marginBottom: '20px' }}>
                AI Fashion Extractor
              </Title>
              <Paragraph style={{ color: colors.neutral[400], lineHeight: 1.8 }}>
                Transform your fashion catalog with intelligent AI-powered image analysis and attribute extraction.
              </Paragraph>
              <Space size="large" style={{ marginTop: '20px' }}>
                <GithubOutlined style={{ fontSize: '24px', color: colors.neutral[400], cursor: 'pointer' }} />
                <TwitterOutlined style={{ fontSize: '24px', color: colors.neutral[400], cursor: 'pointer' }} />
                <LinkedinOutlined style={{ fontSize: '24px', color: colors.neutral[400], cursor: 'pointer' }} />
              </Space>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Title level={5} style={{ color: '#fff', marginBottom: '20px' }}>
                Product
              </Title>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <a href="#features" style={{ color: colors.neutral[400], textDecoration: 'none' }}>Features</a>
                <a href="#pricing" style={{ color: colors.neutral[400], textDecoration: 'none' }}>Pricing</a>
                <a href="#api" style={{ color: colors.neutral[400], textDecoration: 'none' }}>API Docs</a>
                <a href="#integrations" style={{ color: colors.neutral[400], textDecoration: 'none' }}>Integrations</a>
              </div>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Title level={5} style={{ color: '#fff', marginBottom: '20px' }}>
                Company
              </Title>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <a href="#about" style={{ color: colors.neutral[400], textDecoration: 'none' }}>About Us</a>
                <a href="#careers" style={{ color: colors.neutral[400], textDecoration: 'none' }}>Careers</a>
                <a href="#blog" style={{ color: colors.neutral[400], textDecoration: 'none' }}>Blog</a>
                <a href="#press" style={{ color: colors.neutral[400], textDecoration: 'none' }}>Press Kit</a>
              </div>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Title level={5} style={{ color: '#fff', marginBottom: '20px' }}>
                Contact
              </Title>
              <Space direction="vertical" size="middle">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <MailOutlined style={{ color: colors.primary[400] }} />
                  <span style={{ color: colors.neutral[400] }}>support@aifashion.ai</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <PhoneOutlined style={{ color: colors.primary[400] }} />
                  <span style={{ color: colors.neutral[400] }}>+1 (555) 123-4567</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <EnvironmentOutlined style={{ color: colors.primary[400] }} />
                  <span style={{ color: colors.neutral[400] }}>San Francisco, CA</span>
                </div>
              </Space>
            </Col>
          </Row>

          <Divider style={{ background: colors.neutral[700], margin: '40px 0 24px' }} />

          <Row justify="space-between" align="middle">
            <Col xs={24} md={12} style={{ textAlign: 'center', marginBottom: '16px' }}>
              <Text style={{ color: colors.neutral[500] }}>
                © 2025 AI Fashion Extractor. All rights reserved.
              </Text>
            </Col>
            <Col xs={24} md={12} style={{ textAlign: 'center' }}>
              <Space split={<span style={{ color: colors.neutral[600] }}>|</span>}>
                <a href="#privacy" style={{ color: colors.neutral[500], textDecoration: 'none' }}>Privacy Policy</a>
                <a href="#terms" style={{ color: colors.neutral[500], textDecoration: 'none' }}>Terms of Service</a>
                <a href="#cookies" style={{ color: colors.neutral[500], textDecoration: 'none' }}>Cookie Policy</a>
              </Space>
            </Col>
          </Row>
        </div>
      </div>
      </div>
    </div>
  );
};

export default LandingPage;