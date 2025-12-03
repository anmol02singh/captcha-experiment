import React, { useState, useRef, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, RotateCw, Volume2 } from 'lucide-react';
import textBased1 from './images/text/textBased1.png';
import textBased2 from './images/text/textBased2.png';
import textBased3 from './images/text/textBased3.png';

const GROUP_ORDERS = {
  IPT: ['Image', 'Puzzle', 'Text'],
  TIP: ['Text', 'Image', 'Puzzle'],
  PTI: ['Puzzle', 'Text', 'Image']
};

const TEXT_CAPTCHAS = [
  { id: 1, answer: '6T9JBCDS', imageUrl: textBased1 },
  { id: 2, answer: '831632', imageUrl: textBased2 },
  { id: 3, answer: 'KM8CXKZ8t', imageUrl: textBased3 },
];

const exportToCSV = (participantId, group, results) => {
  const csvRows = [];
  
  // Header
  csvRows.push('ParticipantID,Group,CAPTCHAType,Trial,SolveTime_sec,ErrorRate,Attempts');
  
  // Data rows
  results.forEach((result, roundIdx) => {
    for (let trial = 1; trial <= 3; trial++) {
      const row = [
        participantId,
        group,
        result.type,
        trial,
        (result.time / 1000 / 3).toFixed(3), // Average time per trial
        result.attempts || 0, // Total errors for this round
        result.attempts || 0  // Attempts count
      ];
      csvRows.push(row.join(','));
    }
  });
  
  // Create and download CSV
  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `captcha_study_${participantId}_${group}_${new Date().getTime()}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};

// Slider Puzzle CAPTCHA
const generateSliderPuzzle = () => {
  const targetPosition = Math.floor(Math.random() * 61) + 20; // 20-80%
  return { targetPosition, tolerance: 5 };
};

// Text CAPTCHA Component
const TextCaptcha = ({ captchaData, onSubmit, error, trial }) => {
  const [input, setInput] = useState('');
  
  useEffect(() => {
    setInput('');
  }, [captchaData]);
  
  const handleSubmit = () => {
    if (!input.trim()) return;
    const isCorrect = input.toUpperCase() === captchaData.answer.toUpperCase();
    onSubmit(isCorrect);
    if (!isCorrect) setInput('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-gray-300 rounded-lg p-6 bg-white shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-700 font-medium">Type the characters you see below</div>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-gray-100 rounded transition">
              <RotateCw className="w-4 h-4 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded transition">
              <Volume2 className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="bg-gray-100 border-2 border-gray-300 rounded-lg p-8 mb-4 flex items-center justify-center min-h-[120px]">
          <img src={captchaData.imageUrl} alt="CAPTCHA" className="w-full" />
        </div>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type the characters above"
          className="w-full p-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
          autoFocus
        />
        
        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-300 rounded text-red-700 text-sm flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            Incorrect. Please try again.
          </div>
        )}
      </div>
      
      <button 
        onClick={handleSubmit}
        className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 transition"
      >
        Verify
      </button>
    </div>
  );
};

// Custom Image Grid CAPTCHA
const ImageCaptcha = ({ onSubmit, error, trial }) => {
  const [selected, setSelected] = useState(new Set());
  const [challenge, setChallenge] = useState(null);

  // Challenge configurations
  const challenges = [
    { name: 'cars', label: 'cars', correctCount: 3, wrongCount: 6 },
    { name: 'crosswalk', label: 'crosswalks', correctCount: 2, wrongCount: 7 },
    { name: 'stairs', label: 'stairs', correctCount: 3, wrongCount: 6 }
  ];

  // Initialize challenge on mount
  useEffect(() => {
    const challengeType = challenges[trial % challenges.length];
    const images = [];
    
    try {
      // Load correct images
      for (let i = 1; i <= challengeType.correctCount; i++) {
        images.push({
          src: require(`./images/image/${challengeType.name}/right-${i}.png`),
          isCorrect: true,
          id: `right-${i}`
        });
      }
      
      // Load wrong images
      for (let i = 1; i <= challengeType.wrongCount; i++) {
        images.push({
          src: require(`./images/image/${challengeType.name}/wrong-${i}.png`),
          isCorrect: false,
          id: `wrong-${i}`
        });
      }
      
      // Shuffle images
      const shuffled = images.sort(() => Math.random() - 0.5);
      
      setChallenge({
        type: challengeType,
        images: shuffled
      });
    } catch (err) {
      console.error('Error loading images:', err);
    }
  }, [trial]);

  const handleImageClick = (index) => {
    const newSelected = new Set(selected);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelected(newSelected);
  };

  const handleVerify = () => {
    if (!challenge) return;
    
    // Check if all selected images are correct
    const selectedImages = Array.from(selected).map(idx => challenge.images[idx]);
    const correctImages = challenge.images.filter(img => img.isCorrect);
    
    // Must select exactly the correct images
    const allCorrectSelected = correctImages.every((img) => {
      const imageIndex = challenge.images.indexOf(img);
      return selected.has(imageIndex);
    });
    
    const noIncorrectSelected = selectedImages.every(img => img.isCorrect);
    const correctCount = selectedImages.filter(img => img.isCorrect).length;
    
    const isCorrect = allCorrectSelected && noIncorrectSelected && correctCount === correctImages.length;
    
    onSubmit(isCorrect);
    if (!isCorrect) {
      setSelected(new Set());
    }
  };

  if (!challenge) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
        <div className="bg-blue-500 text-white p-4">
          <h3 className="text-lg font-semibold">Select all images with</h3>
          <p className="text-2xl font-bold">{challenge.type.label}</p>
          <p className="text-sm mt-1">Click verify once there are none left.</p>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-3 gap-2 mb-4">
            {challenge.images.map((image, idx) => (
              <button
                key={idx}
                onClick={() => handleImageClick(idx)}
                className={`aspect-square overflow-hidden border-4 transition-all ${
                  selected.has(idx) 
                    ? 'border-blue-500 opacity-75' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <img 
                  src={image.src} 
                  alt={`Option ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded text-red-700 text-sm flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              Incorrect selection. Please try again.
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setSelected(new Set())}
              className="flex-1 bg-gray-200 text-gray-700 p-3 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              <RotateCw className="w-4 h-4 inline mr-2" />
              Clear
            </button>
            <button
              onClick={handleVerify}
              className="flex-1 bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Verify
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// puzzle - ONLY SLIDER
const PuzzleCaptcha = ({ puzzleData, onSubmit, error, trial }) => {
  const [sliderValue, setSliderValue] = useState(0);

  const handleSliderSubmit = () => {
    const diff = Math.abs(sliderValue - puzzleData.targetPosition);
    const isCorrect = diff <= puzzleData.tolerance;
    onSubmit(isCorrect);
    if (!isCorrect) setSliderValue(0);
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-gray-300 rounded-lg p-6 bg-white shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Slider Puzzle</h3>
        <p className="text-sm text-gray-600 mb-6">
          Drag the slider to align the puzzle piece with the target position
        </p>

        <div className="relative bg-gradient-to-r from-blue-100 to-purple-100 h-40 rounded-lg border-2 border-gray-300 mb-4 overflow-hidden">
          <div 
            className="absolute top-0 bottom-0 w-1 bg-red-500"
            style={{ left: `${puzzleData.targetPosition}%` }}
          />
          <div 
            className="absolute top-1/2 -translate-y-1/2 text-xs bg-red-500 text-white px-2 py-1 rounded"
            style={{ left: `${puzzleData.targetPosition}%`, transform: 'translateX(-50%) translateY(-50%)' }}
          >
            Target
          </div>

          <div 
            className="absolute top-1/2 -translate-y-1/2 w-16 h-16 bg-blue-600 rounded-lg shadow-lg flex items-center justify-center text-white font-bold text-2xl transition-all"
            style={{ left: `${sliderValue}%`, transform: 'translateX(-50%) translateY(-50%)' }}
          >
            🧩
          </div>
        </div>

        <input
          type="range"
          min="0"
          max="100"
          value={sliderValue}
          onChange={(e) => setSliderValue(Number(e.target.value))}
          className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        
        <div className="text-center text-sm text-gray-600 mt-2">
          Position: {sliderValue}%
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-300 rounded text-red-700 text-sm flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            Not quite right. Try to get closer to the target!
          </div>
        )}
      </div>
      
      <button 
        onClick={handleSliderSubmit}
        className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 transition"
      >
        Verify Position
      </button>
    </div>
  );
};

export default function CaptchaExperiment() {
  const [stage, setStage] = useState('intro');
  const [group, setGroup] = useState('');
  const [participantId, setParticipantId] = useState('');
  const [currentRound, setCurrentRound] = useState(0);
  const [currentTrial, setCurrentTrial] = useState(0);
  const [roundStartTime, setRoundStartTime] = useState(null);
  const [error, setError] = useState(false);
  const [results, setResults] = useState([]);
  const [currentCaptchaData, setCurrentCaptchaData] = useState(null);
  const [attempts, setAttempts] = useState(0);

  const order = group ? GROUP_ORDERS[group] : [];
  const currentType = order[currentRound];

  const generateCaptchaData = (type, trialNum) => {
    if (type === 'Text') {
      const index = currentRound * 3 + trialNum;
      return TEXT_CAPTCHAS[index % TEXT_CAPTCHAS.length];
    } else if (type === 'Puzzle') {
      return { type: 'slider', data: generateSliderPuzzle() };
    }
    return null;
  };

  const startExperiment = () => {
    if (!group || !participantId) {
      alert('Please enter participant ID and select a group');
      return;
    }
    setStage('experiment');
    setCurrentRound(0);
    setCurrentTrial(0);
    setRoundStartTime(Date.now());
    setResults([]);
    setAttempts(0);
    
    const initialData = generateCaptchaData(order[0], 0);
    setCurrentCaptchaData(initialData);
  };

  const handleCaptchaComplete = (isCorrect, customTime = null) => {
    if (!isCorrect) {
      setError(true);
      setAttempts(prev => prev + 1);
      
      const updatedResults = [...results];
      if (!updatedResults[currentRound]) {
        updatedResults[currentRound] = { type: currentType, time: 0, attempts: 0 };
      }
      updatedResults[currentRound].attempts += 1;
      setResults(updatedResults);
      
      setTimeout(() => setError(false), 2000);
      return;
    }

    setError(false);

    if (currentTrial < 2) {
      setTimeout(() => {
        const nextTrial = currentTrial + 1;
        setCurrentTrial(nextTrial);
        setAttempts(0);
        const nextData = generateCaptchaData(currentType, nextTrial);
        setCurrentCaptchaData(nextData);
      }, 500);
    } else {
      const roundTime = customTime || (Date.now() - roundStartTime);
      const updatedResults = [...results];
      
      if (!updatedResults[currentRound]) {
        updatedResults[currentRound] = { type: currentType, time: roundTime, attempts };
      } else {
        updatedResults[currentRound].time = roundTime;
      }
      
      setResults(updatedResults);

      if (currentRound < 2) {
        setTimeout(() => {
          const nextRound = currentRound + 1;
          setCurrentRound(nextRound);
          setCurrentTrial(0);
          setAttempts(0);
          setRoundStartTime(Date.now());
          const nextData = generateCaptchaData(order[nextRound], 0);
          setCurrentCaptchaData(nextData);
        }, 1000);
      } else {
        setTimeout(() => setStage('results'), 500);
      }
    }
  };

  const resetExperiment = () => {
    setStage('intro');
    setGroup('');
    setParticipantId('');
    setCurrentRound(0);
    setCurrentTrial(0);
    setResults([]);
    setAttempts(0);
  };

  if (stage === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">CAPTCHA Usability Study</h1>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Study Design:</strong> Text CAPTCHAs use hardcoded images, Image CAPTCHAs use custom image grids, and Puzzle CAPTCHAs are slider challenges.
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-3">Instructions</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>You will complete 3 rounds of CAPTCHA challenges</li>
                <li>Each round contains 3 CAPTCHAs of the same type</li>
                <li>Solve each CAPTCHA as quickly and accurately as possible</li>
                <li>The system tracks your time and error count automatically</li>
                <li>Total estimated time: 10-15 minutes</li>
              </ul>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Participant ID</label>
                <input
                  type="text"
                  value={participantId}
                  onChange={(e) => setParticipantId(e.target.value)}
                  placeholder="Enter your ID (e.g., P01)"
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Group Assignment</label>
                <select
                  value={group}
                  onChange={(e) => setGroup(e.target.value)}
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Select Group</option>
                  <option value="IPT">Group 1 (IPT - Image, Puzzle, Text)</option>
                  <option value="TIP">Group 2 (TIP - Text, Image, Puzzle)</option>
                  <option value="PTI">Group 3 (PTI - Puzzle, Text, Image)</option>
                </select>
              </div>
            </div>

            <button
              onClick={startExperiment}
              disabled={!group || !participantId}
              className="w-full bg-blue-600 text-white p-4 rounded-lg text-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              Start Experiment
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'results') {
    const totalTime = results.reduce((sum, r) => sum + r.time, 0);
    const totalAttempts = results.reduce((sum, r) => sum + (r.attempts || 0), 0);

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-8">
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-800">Experiment Complete!</h1>
            <p className="text-gray-600 mt-2">Participant: {participantId} | Group: {group}</p>
          </div>

          <div className="space-y-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Round Results</h2>
              <div className="space-y-4">
                {results.map((result, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-lg shadow">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold text-lg">Round {idx + 1}: {result.type}</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span>Time: {(result.time / 1000).toFixed(2)}s</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span>Errors: {result.attempts || 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-100 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Summary</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg text-center">
                  <p className="text-gray-600 text-sm mb-1">Total Time</p>
                  <p className="text-2xl font-bold text-blue-600">{(totalTime / 1000).toFixed(2)}s</p>
                </div>
                <div className="bg-white p-4 rounded-lg text-center">
                  <p className="text-gray-600 text-sm mb-1">Total Errors</p>
                  <p className="text-2xl font-bold text-red-600">{totalAttempts}</p>
                </div>
              </div>
            </div>

            {/* GoStats Export Section */}
            <div className="bg-green-50 border-2 border-green-300 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-3 text-green-800">📊 Export for GoStats Analysis</h2>
              <p className="text-sm text-gray-700 mb-4">
                Download CSV file formatted for ANOVA analysis in GoStats
              </p>
              <button
                onClick={() => exportToCSV(participantId, group, results)}
                className="w-full bg-green-600 text-white p-4 rounded-lg text-lg font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2"
              >
                📥 Download CSV for GoStats
              </button>
              <p className="text-xs text-gray-500 mt-3">
                Format: ParticipantID, Group, CAPTCHAType, Trial, SolveTime_sec, ErrorRate, Attempts
              </p>
            </div>

            <button
              onClick={resetExperiment}
              className="w-full bg-blue-600 text-white p-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition"
            >
              Start New Experiment
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold text-gray-800">
                Round {currentRound + 1}: {currentType}
              </h1>
              <div className="flex items-center gap-2 text-gray-600 bg-gray-100 px-4 py-2 rounded-lg">
                <Clock className="w-5 h-5" />
                <span className="font-mono text-lg">
                  {roundStartTime ? ((Date.now() - roundStartTime) / 1000).toFixed(1) : '0.0'}s
                </span>
              </div>
            </div>
            
            <div className="flex gap-2 mb-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`flex-1 h-3 rounded-full transition-all ${
                    i < currentTrial ? 'bg-green-500' : i === currentTrial ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            
            <p className="text-sm text-gray-600">
              Trial {currentTrial + 1} of 3 {attempts > 0 && `• Errors: ${attempts}`}
            </p>
          </div>

          {currentType === 'Text' && currentCaptchaData && (
            <TextCaptcha
              captchaData={currentCaptchaData}
              onSubmit={handleCaptchaComplete}
              error={error}
              trial={currentTrial}
            />
          )}

          {currentType === 'Image' && (
            <ImageCaptcha
              key={`image-${currentRound}-${currentTrial}`}
              onSubmit={handleCaptchaComplete}
              error={error}
              trial={currentTrial}
            />
          )}

          {currentType === 'Puzzle' && currentCaptchaData && (
            <PuzzleCaptcha
              key={`puzzle-${currentRound}-${currentTrial}`}
              puzzleData={currentCaptchaData.data}
              onSubmit={handleCaptchaComplete}
              error={error}
              trial={currentTrial}
            />
          )}
        </div>

        <div className="mt-6 bg-white rounded-lg shadow p-4">
          <p className="text-xs text-gray-500 text-center">
            Participant: {participantId} | Group: {group} | Round {currentRound + 1}/3 | Trial {currentTrial + 1}/3
          </p>
        </div>
      </div>
    </div>
  );
}