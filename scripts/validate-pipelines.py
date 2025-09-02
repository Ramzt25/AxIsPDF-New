# Pipeline Validation Script
# Test and validate pipeline execution with sample PDFs

import json
import os
import sys
import subprocess
import yaml
from pathlib import Path
from typing import Dict, List, Any
import time

class PipelineValidator:
    def __init__(self, teambeam_cli: str = "./cli/dist/index.js"):
        self.cli_path = teambeam_cli
        self.test_results = []
        
    def run_pipeline(self, pipeline_path: str, working_dir: str = ".") -> Dict[str, Any]:
        """Run a pipeline and capture results"""
        
        start_time = time.time()
        
        try:
            # Run the TeamBeam CLI
            cmd = ["node", self.cli_path, "run", pipeline_path]
            result = subprocess.run(
                cmd, 
                cwd=working_dir,
                capture_output=True, 
                text=True,
                timeout=60  # 1 minute timeout
            )
            
            duration = time.time() - start_time
            
            return {
                "success": result.returncode == 0,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "duration": duration,
                "exit_code": result.returncode
            }
            
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "stdout": "",
                "stderr": "Pipeline execution timed out after 60 seconds",
                "duration": 60.0,
                "exit_code": -1
            }
        except Exception as e:
            return {
                "success": False,
                "stdout": "",
                "stderr": str(e),
                "duration": time.time() - start_time,
                "exit_code": -1
            }
    
    def validate_outputs(self, expected_outputs: List[str], working_dir: str = ".") -> Dict[str, Any]:
        """Check if expected output files were created"""
        
        results = {
            "files_created": [],
            "files_missing": [],
            "total_expected": len(expected_outputs)
        }
        
        for output_path in expected_outputs:
            full_path = Path(working_dir) / output_path
            if full_path.exists():
                results["files_created"].append(output_path)
            else:
                results["files_missing"].append(output_path)
        
        results["success"] = len(results["files_missing"]) == 0
        results["created_count"] = len(results["files_created"])
        results["missing_count"] = len(results["files_missing"])
        
        return results
    
    def validate_json_output(self, json_path: str, required_fields: List[str]) -> Dict[str, Any]:
        """Validate JSON output has required fields"""
        
        if not Path(json_path).exists():
            return {
                "success": False,
                "error": f"JSON file not found: {json_path}"
            }
        
        try:
            with open(json_path, 'r') as f:
                data = json.load(f)
            
            missing_fields = []
            for field in required_fields:
                if field not in data:
                    missing_fields.append(field)
            
            return {
                "success": len(missing_fields) == 0,
                "missing_fields": missing_fields,
                "data_keys": list(data.keys()) if isinstance(data, dict) else [],
                "data_type": type(data).__name__
            }
            
        except json.JSONDecodeError as e:
            return {
                "success": False,
                "error": f"Invalid JSON: {e}"
            }
    
    def test_pipeline(self, pipeline_name: str, config: Dict[str, Any]) -> Dict[str, Any]:
        """Test a single pipeline with validation"""
        
        print(f"\n🧪 Testing pipeline: {pipeline_name}")
        print(f"   Pipeline: {config['pipeline']}")
        
        # Run the pipeline
        result = self.run_pipeline(config["pipeline"], config.get("working_dir", "."))
        
        test_result = {
            "name": pipeline_name,
            "pipeline": config["pipeline"],
            "execution": result
        }
        
        if result["success"]:
            print(f"   ✅ Execution successful ({result['duration']:.2f}s)")
            
            # Validate expected outputs
            if "expected_outputs" in config:
                output_validation = self.validate_outputs(
                    config["expected_outputs"], 
                    config.get("working_dir", ".")
                )
                test_result["output_validation"] = output_validation
                
                if output_validation["success"]:
                    print(f"   ✅ All {output_validation['created_count']} expected files created")
                else:
                    print(f"   ❌ Missing {output_validation['missing_count']} files: {output_validation['files_missing']}")
            
            # Validate JSON outputs
            if "json_validations" in config:
                test_result["json_validations"] = {}
                for json_file, required_fields in config["json_validations"].items():
                    json_validation = self.validate_json_output(json_file, required_fields)
                    test_result["json_validations"][json_file] = json_validation
                    
                    if json_validation["success"]:
                        print(f"   ✅ {json_file} has all required fields")
                    else:
                        print(f"   ❌ {json_file} validation failed: {json_validation.get('error', 'Missing fields')}")
            
        else:
            print(f"   ❌ Execution failed ({result['duration']:.2f}s)")
            print(f"   Error: {result['stderr']}")
        
        return test_result
    
    def run_test_suite(self, config_path: str = "test-config.yaml"):
        """Run full test suite from configuration"""
        
        if not Path(config_path).exists():
            print(f"❌ Test configuration not found: {config_path}")
            return False
        
        with open(config_path, 'r') as f:
            config = yaml.safe_load(f)
        
        print("🚀 Starting TeamBeam Pipeline Test Suite")
        print(f"   Config: {config_path}")
        print(f"   CLI: {self.cli_path}")
        
        # Setup test environment
        if "setup" in config:
            print("\n🔧 Setting up test environment...")
            for cmd in config["setup"]:
                print(f"   Running: {cmd}")
                os.system(cmd)
        
        # Run all pipeline tests
        all_results = []
        for test_name, test_config in config.get("tests", {}).items():
            result = self.test_pipeline(test_name, test_config)
            all_results.append(result)
        
        # Generate summary
        passed = sum(1 for r in all_results if r["execution"]["success"])
        total = len(all_results)
        
        print(f"\n📊 Test Summary")
        print(f"   Total: {total}")
        print(f"   Passed: {passed}")
        print(f"   Failed: {total - passed}")
        
        if passed == total:
            print("   🎉 All tests passed!")
            return True
        else:
            print("   ⚠️  Some tests failed")
            return False
    
    def generate_report(self, output_path: str = "test-results.json"):
        """Generate detailed test report"""
        
        report = {
            "timestamp": time.time(),
            "cli_path": self.cli_path,
            "results": self.test_results,
            "summary": {
                "total": len(self.test_results),
                "passed": sum(1 for r in self.test_results if r["execution"]["success"]),
                "failed": sum(1 for r in self.test_results if not r["execution"]["success"])
            }
        }
        
        with open(output_path, 'w') as f:
            json.dump(report, f, indent=2)
        
        print(f"📄 Detailed report saved to: {output_path}")

def main():
    if len(sys.argv) > 1:
        config_file = sys.argv[1]
    else:
        config_file = "test-config.yaml"
    
    validator = PipelineValidator()
    success = validator.run_test_suite(config_file)
    validator.generate_report()
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()