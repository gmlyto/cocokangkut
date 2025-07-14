import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Volume2, Home } from 'lucide-react';

// Import animal images
import crabImg from '@/assets/crab.png';
import fishImg from '@/assets/fish.png';
import shrimpImg from '@/assets/shrimp.png';
import deerImg from '@/assets/deer.png';
import roosterImg from '@/assets/rooster.png';
import gourdImg from '@/assets/gourd.png';

interface Animal {
  id: string;
  name: string;
  image: string;
  vietnamese: string;
}

interface DiceResult {
  face: string;
  animating: boolean;
}

const animals: Animal[] = [
  { id: 'crab', name: 'Crab', image: crabImg, vietnamese: 'Cua' },
  { id: 'fish', name: 'Fish', image: fishImg, vietnamese: 'Cá' },
  { id: 'shrimp', name: 'Shrimp', image: shrimpImg, vietnamese: 'Tôm' },
  { id: 'deer', name: 'Deer', image: deerImg, vietnamese: 'Nai' },
  { id: 'rooster', name: 'Rooster', image: roosterImg, vietnamese: 'Gà' },
  { id: 'gourd', name: 'Gourd', image: gourdImg, vietnamese: 'Bầu' }
];

const BauCuaGame: React.FC = () => {
  const [diceResults, setDiceResults] = useState<DiceResult[]>([
    { face: 'crab', animating: false },
    { face: 'fish', animating: false },
    { face: 'shrimp', animating: false }
  ]);
  const [isRolling, setIsRolling] = useState(false);
  const [gamePhase, setGamePhase] = useState<'ready' | 'rolling' | 'result'>('ready');
  const [waitingForTap, setWaitingForTap] = useState(false);
  
  // Fixed image control state
  const [tapControlActive, setTapControlActive] = useState(false);
  const [tapSequence, setTapSequence] = useState<number[]>([]);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  
  const { toast } = useToast();

  // Fixed image sets for different tap positions
  const FIXED_SETS: Record<number, string[]> = {
    1: ['crab', 'crab', 'crab'], // Tap below first image (position 1)
    2: ['fish', 'fish', 'fish'], // Tap below second image (position 2)
    6: ['gourd', 'gourd', 'gourd'] // Tap below sixth image (position 6)
  };
  
  // Activation sequence: tap positions 2, 1, 6, 1
  const ACTIVATION_SEQUENCE = [2, 1, 6, 1];

  const handleAnimalTap = (position: number) => {
    if (waitingForTap && tapControlActive) {
      // Use fixed set if available, otherwise random
      let results: DiceResult[];
      if (FIXED_SETS[position]) {
        results = FIXED_SETS[position].map(face => ({ face, animating: false }));
        toast({
          title: `🎯 Kết quả cố định ${position}`,
          description: "Đã sử dụng kết quả được thiết lập trước!",
        });
      } else {
        // Random result if position not in fixed sets
        const animalIds = animals.map(a => a.id);
        results = Array.from({ length: 3 }, () => ({
          face: animalIds[Math.floor(Math.random() * animalIds.length)],
          animating: false
        }));
      }
      
      setDiceResults(results);
      setWaitingForTap(false);
      setGamePhase('result');
      
      setTimeout(() => {
        setGamePhase('ready');
      }, 3000);
      return;
    }

    // Handle activation sequence
    const newSequence = [...tapSequence, position];
    setTapSequence(newSequence);
    
    // Check if activation sequence is complete
    if (newSequence.length === ACTIVATION_SEQUENCE.length) {
      const matches = newSequence.every((val, index) => val === ACTIVATION_SEQUENCE[index]);
      if (matches) {
        setTapControlActive(true);
        setTapSequence([]);
        toast({
          title: "🎮 Chế độ điều khiển kích hoạt!",
          description: "Bây giờ bạn có thể điều khiển kết quả bằng cách chạm vào các vị trí!",
        });
      } else {
        // Reset if sequence doesn't match
        if (newSequence.length >= ACTIVATION_SEQUENCE.length) {
          setTapSequence([]);
        }
      }
    }
  };

  const rollDice = () => {
    if (gamePhase !== 'ready') return;

    setIsRolling(true);
    setGamePhase('rolling');
    
    // Animation phase
    setDiceResults(prev => prev.map(dice => ({ ...dice, animating: true })));
    
    setTimeout(() => {
      if (tapControlActive) {
        // Wait for tap if control is active
        setWaitingForTap(true);
        setIsRolling(false);
        toast({
          title: "👆 Chờ chạm",
          description: "Chạm vào vị trí bên dưới hình ảnh để chọn kết quả!",
        });
      } else {
        // Normal random result
        const animalIds = animals.map(a => a.id);
        const results: DiceResult[] = Array.from({ length: 3 }, () => ({
          face: animalIds[Math.floor(Math.random() * animalIds.length)],
          animating: false
        }));
        
        setDiceResults(results);
        setIsRolling(false);
        setGamePhase('result');
        
        setTimeout(() => {
          setGamePhase('ready');
        }, 3000);
      }
    }, 2000);
  };

  const resetGame = () => {
    setGamePhase('ready');
    setTapControlActive(false);
    setTapSequence([]);
    setWaitingForTap(false);
    setDiceResults([
      { face: 'crab', animating: false },
      { face: 'fish', animating: false },
      { face: 'shrimp', animating: false }
    ]);
  };

  return (
    <div 
      ref={gameAreaRef}
      className="min-h-screen bg-gradient-to-br from-game-blue via-blue-800 to-blue-900 relative overflow-hidden"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={resetGame}>
            <Home className="h-4 w-4 text-white" />
          </Button>
          <Button variant="ghost" size="sm">
            <Volume2 className="h-4 w-4 text-white" />
          </Button>
        </div>
        
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white drop-shadow-lg">
            Bầu Cua VNG 2024-2025
          </h1>
          {tapControlActive && (
            <div className="text-xs text-yellow-300 animate-pulse">
              🎮 Chế độ điều khiển đang hoạt động
            </div>
          )}
          {waitingForTap && (
            <div className="text-xs text-green-300 animate-pulse">
              👆 Chờ chạm để chọn kết quả
            </div>
          )}
        </div>
        
        <div className="text-right">
          <div className="text-yellow-300 text-lg font-bold">
            Miễn phí
          </div>
        </div>
      </div>

      {/* Top animals area */}
      <div className="grid grid-cols-3 gap-4 p-4">
        {animals.slice(0, 3).map((animal, index) => (
          <Card 
            key={animal.id}
            className={`p-4 bg-white/90 backdrop-blur-sm border-2 relative overflow-hidden
                       transition-all duration-300 hover:scale-105 cursor-pointer
                       ${waitingForTap ? 'ring-2 ring-green-400' : 'border-gray-300'}`}
            onClick={() => handleAnimalTap(index + 1)}
          >
            <div className="text-center">
              <img 
                src={animal.image} 
                alt={animal.name}
                className="w-16 h-16 mx-auto mb-2 transition-transform duration-300 hover:scale-110"
              />
              <div className="text-sm font-semibold text-gray-800">
                {animal.vietnamese}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Vị trí {index + 1}
              </div>
            </div>
            
            {/* Position indicator */}
            <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
              {index + 1}
            </div>
          </Card>
        ))}
      </div>

      {/* Central dice area */}
      <div className="flex justify-center py-8">
        <div className="relative">
          {/* Dice container */}
          <div className="bg-white/80 backdrop-blur-md rounded-full p-8 shadow-xl border-4 border-white/50">
            <div className="flex gap-6 justify-center items-center">
              {diceResults.map((dice, index) => (
                <div 
                  key={index}
                  className={`w-20 h-20 bg-white rounded-lg shadow-lg border-2 border-gray-300
                             flex items-center justify-center transition-all duration-500
                             ${dice.animating ? 'animate-dice-roll' : ''}
                             ${isRolling ? 'animate-bounce' : ''}`}
                >
                  <img 
                    src={animals.find(a => a.id === dice.face)?.image} 
                    alt="dice"
                    className="w-12 h-12"
                  />
                </div>
              ))}
            </div>
          </div>
          
          {/* Roll button */}
          <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
            {gamePhase === 'ready' ? (
              <Button 
                onClick={rollDice}
                size="lg"
                className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700
                          text-black font-bold px-8 py-4 rounded-full shadow-lg
                          transform transition-all duration-200 hover:scale-105 active:scale-95"
              >
                LẮC XÚC XẮC
              </Button>
            ) : gamePhase === 'rolling' ? (
              <Button 
                disabled
                size="lg"
                className="bg-gray-500 text-white font-bold px-8 py-4 rounded-full"
              >
                {waitingForTap ? 'CHỜ CHẠM' : 'ĐANG LẮC...'}
              </Button>
            ) : (
              <Button 
                disabled
                size="lg"
                className="bg-green-500 text-white font-bold px-8 py-4 rounded-full"
              >
                KẾT QUẢ
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom animals area */}
      <div className="grid grid-cols-3 gap-4 p-4 mt-16">
        {animals.slice(3, 6).map((animal, index) => (
          <Card 
            key={animal.id}
            className={`p-4 bg-white/90 backdrop-blur-sm border-2 relative overflow-hidden
                       transition-all duration-300 hover:scale-105 cursor-pointer
                       ${waitingForTap ? 'ring-2 ring-green-400' : 'border-gray-300'}`}
            onClick={() => handleAnimalTap(index + 4)}
          >
            <div className="text-center">
              <img 
                src={animal.image} 
                alt={animal.name}
                className="w-16 h-16 mx-auto mb-2 transition-transform duration-300 hover:scale-110"
              />
              <div className="text-sm font-semibold text-gray-800">
                {animal.vietnamese}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Vị trí {index + 4}
              </div>
            </div>
            
            {/* Position indicator */}
            <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
              {index + 4}
            </div>
          </Card>
        ))}
      </div>

      {/* Instructions */}
      <div className="text-center py-4 bg-black/20 backdrop-blur-sm mt-8">
        <div className="text-yellow-300 text-sm font-bold mb-2">
          HƯỚNG DẪN KÍCH HOẠT ĐIỀU KHIỂN
        </div>
        <div className="text-white text-xs">
          Chạm theo thứ tự: Vị trí 2 → 1 → 6 → 1
        </div>
        <div className="text-gray-300 text-xs mt-1">
          Vị trí 1: Cua cố định | Vị trí 2: Cá cố định | Vị trí 6: Bầu cố định
        </div>
      </div>

      {/* Bottom branding */}
      <div className="text-center py-4 bg-black/20 backdrop-blur-sm">
        <div className="text-yellow-300 text-xl font-bold">XÓC ĐĨA</div>
        <div className="text-white text-sm">V.N.G : 12092-5021</div>
      </div>

      {/* Floating sparkles effect */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-yellow-300 rounded-full animate-float opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default BauCuaGame;