import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Upload, Plus, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import  DashboardLayout  from '@/components/DashboardLayout';

export const CreateCertificatePage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [fields, setFields] = useState([
    { id: '1', label: 'Recipient Name', x: 50, y: 40, width: 200, height: 40 },
  ]);
  
  const steps = [
    { number: 1, title: 'Group Details' },
    { number: 2, title: 'Template Designer' },
    { number: 3, title: 'Finalize & Deploy' },
  ];
  
  const addField = () => {
    setFields([...fields, {
      id: Date.now().toString(),
      label: 'New Field',
      x: 50,
      y: 50,
      width: 200,
      height: 40,
    }]);
  };
  
  const removeField = (id) => {
    setFields(fields.filter(f => f.id !== id));
  };
  
  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Progress Steps */}
        <div data-aos="fade-down">
          <Button variant="ghost" className="mb-4 text-slate-600 hover:text-slate-900" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <h1 className="text-4xl font-bold text-slate-900 mb-8">Create Certificate Group</h1>
          
          <div className="flex items-center justify-between mb-12">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                      currentStep > step.number
                        ? 'bg-green-600 text-white'
                        : currentStep === step.number
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {currentStep > step.number ? <Check className="w-6 h-6" /> : step.number}
                  </div>
                  <div className="hidden md:block">
                    <div className="text-sm text-slate-500">Step {step.number}</div>
                    <div className="font-semibold text-slate-900">{step.title}</div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-4 rounded transition-colors duration-300 ${
                      currentStep > step.number ? 'bg-green-600' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Step 1: Group Details */}
        {currentStep === 1 && (
          <Card data-aos="fade-up">
            <CardContent className="p-8 space-y-6">
              <div>
                <Label htmlFor="courseTitle" className="text-lg font-semibold text-slate-900 mb-2 block">
                  Course Title
                </Label>
                <Input
                  id="courseTitle"
                  placeholder="e.g., Web Development Bootcamp 2025"
                  className="py-6 text-lg rounded-xl"
                  data-testid="course-title-input"
                />
              </div>
              
              <div>
                <Label htmlFor="description" className="text-lg font-semibold text-slate-900 mb-2 block">
                  Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of the course or program..."
                  rows={4}
                  className="text-lg rounded-xl"
                  data-testid="course-description-input"
                />
              </div>
              
              <div>
                <Label htmlFor="learners" className="text-lg font-semibold text-slate-900 mb-2 block">
                  Number of Learners
                </Label>
                <Input
                  id="learners"
                  type="number"
                  placeholder="50"
                  className="py-6 text-lg rounded-xl"
                  data-testid="learner-count-input"
                />
                <p className="text-sm text-slate-500 mt-2">
                  Free plan allows up to 50 learners. <a href="/pricing" className="text-blue-600 hover:underline">Upgrade for more</a>
                </p>
              </div>
              
              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => setCurrentStep(2)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 rounded-xl"
                  data-testid="step1-next-button"
                >
                  Continue to Template Designer
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Step 2: Template Designer */}
        {currentStep === 2 && (
          <div className="space-y-6" data-aos="fade-up">
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Upload Certificate Background</h2>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center hover:border-blue-500 transition-colors cursor-pointer">
                  <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-lg text-slate-700 font-medium mb-2">Click to upload or drag and drop</p>
                  <p className="text-sm text-slate-500">PDF files only (Max 5MB)</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Design Your Template</h2>
                  <Button onClick={addField} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Field
                  </Button>
                </div>
                
                {/* Canvas Preview */}
                <div className="bg-slate-100 rounded-xl p-8 mb-6 min-h-[500px] relative border-2 border-slate-300">
                  <div className="absolute inset-8 bg-white rounded-lg shadow-lg flex items-center justify-center">
                    <div className="text-center text-slate-400">
                      <Award className="w-16 h-16 mx-auto mb-4" />
                      <p className="text-lg">Certificate Preview</p>
                      <p className="text-sm">Upload a PDF to see your template</p>
                    </div>
                  </div>
                  
                  {/* Draggable Fields Overlay */}
                  {fields.map((field) => (
                    <div
                      key={field.id}
                      className="absolute bg-blue-100 border-2 border-blue-500 rounded-lg p-3 cursor-move hover:bg-blue-200 transition-colors"
                      style={{
                        left: `${field.x}px`,
                        top: `${field.y}px`,
                        width: `${field.width}px`,
                        minHeight: `${field.height}px`,
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <GripVertical className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900 flex-1">{field.label}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 hover:bg-red-100"
                          onClick={() => removeField(field.id)}
                        >
                          <Trash2 className="w-3 h-3 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Field List */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-slate-900">Template Fields ({fields.length})</h3>
                  {fields.map((field) => (
                    <div key={field.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <GripVertical className="w-5 h-5 text-slate-400" />
                      <Input
                        value={field.label}
                        onChange={(e) => {
                          const updated = fields.map(f => f.id === field.id ? {...f, label: e.target.value} : f);
                          setFields(updated);
                        }}
                        className="flex-1 rounded-lg"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="hover:bg-red-100"
                        onClick={() => removeField(field.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-between pt-6">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    className="px-8 py-6 rounded-xl"
                  >
                    <ArrowLeft className="mr-2 w-5 h-5" />
                    Back
                  </Button>
                  <Button
                    onClick={() => setCurrentStep(3)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 rounded-xl"
                    data-testid="step2-next-button"
                  >
                    Continue to Finalize
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Step 3: Finalize & Deploy */}
        {currentStep === 3 && (
          <div className="space-y-6" data-aos="fade-up">
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Form Preview</h2>
                <p className="text-slate-600 mb-6">This is what learners will see when claiming their certificate</p>
                
                <div className="bg-slate-50 rounded-xl p-8 border-2 border-slate-200">
                  <div className="max-w-md mx-auto bg-white rounded-xl p-8 shadow-lg">
                    <h3 className="text-2xl font-bold text-slate-900 mb-6">Claim Your Certificate</h3>
                    <div className="space-y-4">
                      {fields.map((field) => (
                        <div key={field.id}>
                          <Label className="text-slate-700 font-medium mb-2 block">{field.label}</Label>
                          <Input placeholder={`Enter ${field.label.toLowerCase()}`} className="rounded-lg" />
                        </div>
                      ))}
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-xl mt-6">
                        Claim Certificate
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Ready to Deploy?</h2>
                <p className="text-slate-600 mb-6">
                  Once deployed, you'll receive a unique join code and shareable link that learners can use to claim their certificates.
                </p>
                
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(2)}
                    className="px-8 py-6 rounded-xl"
                  >
                    <ArrowLeft className="mr-2 w-5 h-5" />
                    Back
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 rounded-xl shadow-lg"
                    data-testid="deploy-group-button"
                  >
                    <Check className="mr-2 w-5 h-5" />
                    Deploy Group
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

const Award = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="8" r="6"></circle>
    <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"></path>
  </svg>
);
