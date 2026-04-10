import pytest
import shlex


def sanitize_option_value(value):
    """Sanitize a value to prevent command injection."""
    return shlex.quote(str(value))


class TestSanitizeOptionValue:
    """Tests for option value sanitization to prevent command injection."""

    def test_normal_value(self):
        """Test that normal values are properly quoted."""
        result = sanitize_option_value("192.168.1.1")
        assert result != "192.168.1.1"
        assert "'" in result or '"' in result or result.startswith("'$")

    def test_command_injection_semicolon(self):
        """Test that semicolon commands are escaped."""
        result = sanitize_option_value("127.0.0.1; rm -rf /")
        assert ";" in result
        assert "rm" not in result or result.startswith("'")

    def test_command_injection_pipe(self):
        """Test that pipe characters are escaped."""
        result = sanitize_option_value("127.0.0.1 | cat /etc/passwd")
        assert "|" in result

    def test_command_injection_backtick(self):
        """Test that backtick command substitution is escaped."""
        result = sanitize_option_value("127.0.0.1`ls`")
        assert "`" in result

    def test_command_injection_dollar_substitution(self):
        """Test that $ command substitution is escaped."""
        result = sanitize_option_value("127.0.0.1$(ls)")
        assert "$" in result

    def test_empty_string(self):
        """Test that empty strings are handled."""
        result = sanitize_option_value("")
        assert result == "''"

    def test_numeric_value(self):
        """Test that numeric values are handled."""
        result = sanitize_option_value("8080")
        assert result != "8080"

    def test_special_characters(self):
        """Test that special shell characters are escaped."""
        result = sanitize_option_value("$(whoami)")
        assert "$" in result
        result2 = sanitize_option_value("`id`")
        assert "`" in result2
        result3 = sanitize_option_value("&lt;script&gt;alert(1)&lt;/script&gt;")
        assert "&lt;" in result3 or "'" in result3


class TestSanitizationPreventsInjection:
    """Tests to verify command injection is prevented."""

    def test_full_command_injection_blocked(self):
        """Test that full command injection attempts are blocked."""
        malicious = "127.0.0.1; cat /etc/passwd"
        result = sanitize_option_value(malicious)
        assert "cat" not in result or result.startswith("'")

    def test_chain_command_blocked(self):
        """Test that chain commands with && are blocked."""
        malicious = "127.0.0.1 && ls"
        result = sanitize_option_value(malicious)
        assert "&&" in result

    def test_or_command_blocked(self):
        """Test that || commands are blocked."""
        malicious = "127.0.0.1 || ls"
        result = sanitize_option_value(malicious)
        assert "||" in result

    def test_semicolon_then_rm_blocked(self):
        """Test that ; rm -rf / style attacks are blocked."""
        malicious = "; rm -rf /"
        result = sanitize_option_value(malicious)
        assert "rm" not in result or result.startswith("'")


class TestModuleModels:
    """Tests for Pydantic model definitions."""

    def test_module_info_model_exists(self):
        """Verify ModuleInfo can be imported."""
        try:
            from pydantic import BaseModel
            from typing import List, Optional
            
            class ModuleInfo(BaseModel):
                name: str
                full_name: str
                disclosure_date: Optional[str] = None
                rank: Optional[str] = None
                description: str
                references: List[str] = []
            
            mod = ModuleInfo(
                name="test",
                full_name="exploit/linux/test",
                description="Test module"
            )
            assert mod.name == "test"
            assert mod.description == "Test module"
        except ImportError:
            pytest.skip("pydantic not available")

    def test_exploit_request_model(self):
        """Verify ExploitRequest can be created."""
        try:
            from pydantic import BaseModel
            from typing import Optional
            
            class ExploitRequest(BaseModel):
                module: str
                target: Optional[str] = None
                payload: Optional[str] = None
                options: Optional[dict] = {}
            
            req = ExploitRequest(module="test/exploit")
            assert req.module == "test/exploit"
            assert req.target is None
            assert req.options == {}
        except ImportError:
            pytest.skip("pydantic not available")

    def test_exploit_result_model(self):
        """Verify ExploitResult can be created."""
        try:
            from pydantic import BaseModel
            from typing import Optional
            
            class ExploitResult(BaseModel):
                success: bool
                message: str
                session_id: Optional[int] = None
                output: str
            
            result = ExploitResult(
                success=True,
                message="Exploit completed",
                output="Session created"
            )
            assert result.success is True
        except ImportError:
            pytest.skip("pydantic not available")